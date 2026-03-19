---
title: 04_systemd 和 systemctl
createTime: 2025/10/22 16:47:04
permalink: /notes/Linux/z4cszob4/
---

# Systemd的由来
历史上，Linux操作系统的启动一直采用 init进程。
```
sudo /etc/init.d/apache2 start
```

但是这种方法有两个缺点。

* 一是启动时间长。init进程是串行启动，只有前一个进程启动完，才会启动下一个进程。比如说先启动图形化系统，再启动网卡等等；

* 二是启动脚本复杂。init进程只是执行启动脚本，不管其他事情。脚本需要自己处理各种情况，这往往使得脚本变得很长。

##  Systemd的概述
Systemd 就是为了解决这些问题而诞生的。它的设计目标是，为系统的启动和管理提供一套完整的解决方案。

根据 Linux 惯例，字母d是守护进程（daemon）的缩写。 Systemd 这个名字的含义，就是它要守护整个系统。它不仅负责启动操作系统，还负责 僵尸进程的回收 和 服务挂掉后的自动重启。

使用了 Systemd，就不需要再用init了。Systemd 取代了initd，成为系统的第一个进程（PID 等于 1），其他进程都是它的子进程。

```
ps -p 1 #查看PID为1的进程，可以看到就是systemd
```

Systemd 的优点是功能强大，使用方便，缺点是体系庞大，非常复杂。事实上，现在还有很多人反对使用 Systemd，理由就是它过于复杂，与操作系统的其他部分强耦合，违反"keep simple, keep stupid"的Unix 哲学。

* 但是你能想象，重启 sshd, networking 不用 Systemctl 来实现，而是每一个模块用一个不同的命令吗？那才是真的要了老命。😩 *

## 可执行文件和Service
*Service的位置在/lib/systemd/system,放到这里才能被systemd使用*
以一个已经启动了的nginx进程为例，当某某网页返回错误404的时候，我们有时候就会卡了通过
```
systemctl status nginx.service
```
来查看一下是不是Nginx挂掉了，导致前端打不开了。这里引出的具体论点就是:

- 实际工作的是二进制文件 Nginx
- 控制对应 Nginx 的行为: 重启，挂掉后是否拉起的说明书，对应的就是 Nginx.service
- 而Systemd就是参考Service来对实际的进程进行操作的

### 一个典型的Service是啥样的
```
[Unit]
Description=我的自定义APP  # 它是谁
After=network.target      # 它要在网络启动后才启动（逻辑顺序）

[Service]
ExecStart=/usr/bin/python3 /app/main.py  # 怎么启动（二进制程序路径）
Restart=always                           # 挂了怎么办（自动重启）

[Install]
WantedBy=multi-user.target  # 开机自启时属于哪个级别
```

### Systemctl的实际工作流
比如当用户执行 systemctl start nginx 的时候，实际发生的事情是这样的:

* 查找： systemctl 通知 Systemd 寻找名为 nginx.service 的文件
* 解析： Systemd 读取说明书里的 ExecStart=/usr/sbin/nginx, 找到对应的二进制文件
* 执行： Systemd 创建一个环境，把二进制程序跑起来。
* 记录： 程序启动时打印的“Starting Nginx...”等信息，被 journald 守护进程接管。
* 反馈： 这就是为什么可以通过 journalctl -u nginx 来查看程序执行的时候到底发生了什么


# Systemd 服务排查与管理心得

## 一、常用的服务查看与管理命令

### 1. 列出当前已加载的服务
查看系统中所有已加载的服务单元（包括是否运行、是否失败等）：
```bash
systemctl list-units --type=service
```

### 2. 查看单个服务的详细状态
```bash
systemctl status <service>
```
示例：
```bash
systemctl status nginx
```

### 3. 启动、停止、重启与设置开机自启
```bash
systemctl start <service>
systemctl stop <service>
systemctl restart <service>
systemctl enable <service>    # 设置开机自启
systemctl disable <service>   # 取消开机自启
```

### 4. 查看服务对应的 unit 文件
```bash
systemctl cat <service>
```
或直接查看物理路径：
```
/usr/lib/systemd/system/<service>.service
```

---

## 二、Systemd 服务异常排查标准流程

当某个服务启动失败时，可按照以下步骤进行分析与定位。

### 步骤 1：查看服务状态
```bash
systemctl status <service>
```
查看失败原因概要（通常可看到最近的错误日志片段）。

### 步骤 2：查看详细日志
```bash
journalctl -u <service> -b
```
说明：  
`-u` 指定服务单元，`-b` 表示仅查看本次开机后的日志。


### 步骤 3：检查服务配置文件
```bash
systemctl cat <service>
```
确认配置路径、依赖、启动命令等是否正确。

### 步骤 4：尝试手动启动服务
在命令行中直接运行 `ExecStart` 中的启动命令，观察是否有错误提示。  
这一步可帮助判断问题出在 systemd 本身还是程序配置上。

### 步骤 5：检查依赖与系统资源
| 问题类型 | 检查方法 |
|-----------|-----------|
| 依赖服务是否正常 | `systemctl status <dependency>`（如 `dbus`、`network` 等） |
| 端口被占用 | `ss -lntp` 或 `lsof -i` |
| 权限 / SELinux 问题 | `getenforce`、`ls -Z` |
| 内存或文件句柄不足 | `dmesg` 查看内核日志 |

---

## 三、Journalctl的常用命令
在debian最新的操作系统里面，已经取消了/var/log/syslog文件，所有的service的log和系统内核的log都集中使用journalctl进行查看了，以下是
我日常工作中经常使用的命令，老实说journalctl查对应时间点的语法使用起来真的是太糟糕了。

1. 查看最近 1 小时的日志
```
journalctl -u nginx --since "1 hour ago"
```

2. 查看特定日期范围的日志
```
journalctl -u nginx --since "2024-05-01" --until "2024-05-02 03:00"
```

3. 实时查看最新的报错
-f (follow)：实时滚动显示新产生的日志（类似 tail -f）
```
journalctl -u nginx -f
```

4. 查看对应的系统内核日志(-k)
```
journalctl -k | tail -n 50
```

