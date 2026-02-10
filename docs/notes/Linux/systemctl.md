---
title: systemctl
createTime: 2025/10/22 16:47:04
permalink: /notes/Linux/z4cszob4/
---
# Systemd的由来
历史上，Linux 的启动一直采用init进程。sudo /etc/init.d/apache2 start

这种方法有两个缺点。

* 一是启动时间长。init进程是串行启动，只有前一个进程启动完，才会启动下一个进程。

* 二是启动脚本复杂。init进程只是执行启动脚本，不管其他事情。脚本需要自己处理各种情况，这往往使得脚本变得很长。

##  Systemd的概述
Systemd 就是为了解决这些问题而诞生的。它的设计目标是，为系统的启动和管理提供一套完整的解决方案。

根据 Linux 惯例，字母d是守护进程（daemon）的缩写。 Systemd 这个名字的含义，就是它要守护整个系统。

使用了 Systemd，就不需要再用init了。Systemd 取代了initd，成为系统的第一个进程（PID 等于 1），其他进程都是它的子进程。
$ systemctl --version

Systemd 的优点是功能强大，使用方便，缺点是体系庞大，非常复杂。事实上，现在还有很多人反对使用 Systemd，理由就是它过于复杂，与操作系统的其他部分强耦合，违反"keep simple, keep stupid"的Unix 哲学。

Systemd 并不是一个命令，而是一组命令，涉及到系统管理的方方面面

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

## 三、补充建议
- 若服务长期启动失败，可执行：
  ```bash
  journalctl -xe
  ```
  查看系统级错误详情。  
- 服务配置修改后需执行：
  ```bash
  systemctl daemon-reload
  ```
  让 systemd 重新加载配置。  
- 若要恢复服务默认配置，可使用：
  ```bash
  systemctl revert <service>
  ```

## systemd和service
安装包下载下来后有:

- cmdb-agent  --> 真正干活的二进制文件
- cmdb-agent.service  --> systemd的"托管说明书"，说明书里面说了该怎么启动进程，进程挂了怎么拉起这些内容
- deploy.sh(可选)    --> 一次性部署脚本，停掉旧agent，准备运行环境，把新的agent注册给systemd并启动

. systemd接管agent：
  - cp cmdb-agent.service /etc/systemd/system(所有被systemd管理的服务都在这里)
  - 创建软链接 systemctl enable x.service 
    - /etc/systemd/system/multi-user.target.wants/cmdb-agent.service
    当系统进入multi-user.target(正常开机时)，请启动它
  - systemctl start cmdb-agent                                  
