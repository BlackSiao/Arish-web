---
title: 边边角角
createTime: 2025/10/14 09:15:12
permalink: /notes/Linux/w7ph6v99/
---
# Linux 进程与端口管理笔记

## 1. ps 命令中的 color 输出解释

在使用 `ps aux | grep` 命令时，可能会看到类似以下输出：

```
root      100815  0.0  0.0  19192  7012 ?        S    09:15   0:01 /usr/local/sbin/snmpd -p /var/net-snmp/snmpd.pid
root      473487  0.0  0.0   6380  2240 pts/2    S+   10:15   0:00 grep --color=auto snmpd
```

- **解释**：`grep --color=auto` 是 `grep` 命令的默认选项，用于高亮显示匹配到的内容（如 "snmpd"），以便于查看。这与进程过滤无关，仅是 `grep` 的显示效果。
- **无关性**：它不会影响 `ps` 的实际输出，仅是 `grep` 的语法特性。

## 2. ps aux 命令输出解析

`ps aux` 显示进程的详细信息。示例输出：

```
root  86967  0.0  0.0  19184 7000 ?    S Oct10  1:09  /usr/local/sbin/snmpd -p /var/net-snmp/snmpd.pid
```

各字段含义（从左到右）：

| 字段 | 含义 |
|------|------|
| root | 用户名 |
| 86967 | PID（进程 ID） |
| 0.0 | CPU 百分比占用 |
| 0.0 | 内存百分比占用 |
| 19184 | VSZ（虚拟内存大小，约 19 MB） |
| 7000 | RSS（实际内存大小，约 7 MB） |
| ? | TTY（终端，无关联终端） |
| S | 进程状态（S 表示后台睡眠） |
| Oct10 | 启动时间 |
| 1:09 | CPU 占用总时间 |
| /usr/local/sbin/snmpd ... | 启动命令 |

### 2.1 为啥有些进程的command会显示一堆？
有些情况下，command词条会显示该进程的可执行文件路径、对应的配置路径，而有些进程对应的词条则是空无一物。这个原因在于进程的启动方式不同(这一点我还不是很能理解),可以在/proc/<进程号>/cmdline|cmm文件里面看到进程对应的command词条。而有一些进程没有这两个文件，自然就啥都没有。

## 3. ps -ef 命令：查看父进程 (PPID)

- **用途**：显示进程的完整信息，包括父进程 ID (PPID)，适用于追踪进程树。
- **参数解释**：
  - `e`：显示所有进程（everything）。
  - `f`：全格式（full format）。

示例输出：

```
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  7 21:41 ?        00:00:00 /sbin/init
root           2       1  0 21:41 ?        00:00:00 /init
```

| 字段 | 含义 |
|------|------|
| UID | 用户 ID |
| PID | 进程 ID |
| PPID | 父进程 ID |
| C | CPU 使用率 |
| STIME | 启动时间 |
| TTY | 终端 |
| TIME | CPU 时间 |
| CMD | 命令 |

## 4. 进程、fork() 与父子进程关系

### 4.1 基本概念
- **进程**：这里将“程序”与“进程”等同，指系统中运行的实体（如 `ps aux` 中显示的 PID 对应项）。
- **fork()**：系统调用，用于创建子进程。子进程是父进程的复制品。
- **进程起源**：Linux 中所有进程源于 init/systemd (PID=1)，通过反复 `fork()` 演变。

### 4.2 父子进程定义
- **父进程**：使用 `fork()` 创建其他进程的进程。
- **子进程**：被父进程 `fork()` 出的进程，受父进程控制。
- **资源回收**：父进程终止时，会回收所有子进程的系统资源。

### 4.3 在 Linux 中查看父子进程关系
使用 `pstree -p` 命令查看进程树（带 PID）。

示例（nginx 进程）：

```
[root@localhost sbin]# pstree -p | grep nginx
           |-nginx(22605)-+-nginx(27796)
           |              `-nginx(27797)
```

- **解释**：PID 22605 是父进程，fork 出了子进程 27796 和 27797。

结合 `ps aux | grep nginx` 确认：

```
root       22605  0.0  0.0   8756  5732 ?        Ss   Oct14   0:00 nginx: master process /usr/local/appsys/normal/package/nginx/sbin/nginx
appuser    27796  0.0  0.0   9580  6848 ?        S    Oct14   0:00 nginx: worker process
appuser    27797  0.0  0.0  10604  6848 ?        S    Oct14   0:00 nginx: worker process
```

- **父进程**：master process (PID 22605)，负责管理。
- **子进程**：worker processes，负责处理请求。

### 4.4 为什么父子进程名称相同？
以 nginx 为例：
1. 启动主进程（Master）：加载配置、管理子进程。
2. Master 通过 `fork()` 创建多个 Worker 子进程：处理客户端请求。

所有进程源于同一可执行文件 `/usr/sbin/nginx`，故名称相同，但功能不同。

### 4.5 僵尸进程 (defunct)
- **定义**：子进程执行完毕（exit、错误或信号终止）后，其进程控制块仍保留在进程表中，处于“终止状态”。已回收 PID，但占用资源。
- **正常回收**：父进程通过 `wait()` 系统调用回收子进程。

#### 查看僵尸进程
```
[root@localhost sbin]# ps aux | grep defunct
admin    1568740  0.0  0.0      0     0 pts/0    Z    Oct15   0:00 [clish] <defunct>
```
- **状态 Z**：表示僵尸进程。

#### 回收僵尸进程
1. **首选**：向父进程发送 `SIGCHLD` 信号（`kill -SIGCHLD <父PID>`），促使父进程调用 `wait()`。
2. **备选**：如果父进程拒绝，终止父进程（`kill <父PID>`），让 init (PID=1) 收养并回收僵尸进程。

## 5. ss -lntp：查看进程监听端口

- **用途**：显示监听端口及其占用进程，便于排查端口冲突。

### 5.1 参数说明

| 参数 | 含义 |
|------|------|
| -l | 只显示监听 (LISTEN) 端口 |
| -n | 不解析域名/IP，直接显示数字 |
| -t | 只显示 TCP 连接 |
| -p | 显示占用端口的进程 (PID/程序名) |

### 5.2 输出示例
```
LISTEN  0  128  0.0.0.0:80     0.0.0.0:*    users:(("nginx",pid=1204,fd=6))
LISTEN  0  100  127.0.0.1:3306 0.0.0.0:*    users:(("mysqld",pid=1563,fd=10))
```

- **解释**：80 端口被 nginx (PID 1204) 占用；3306 端口被 mysqld (PID 1563) 占用。

### 5.3 从监听地址判断访问范围

| 监听地址 | 说明 |
|----------|------|
| 127.0.0.1:3306 | 只允许本机访问 |
| 0.0.0.0:3306 | 允许外部（公网）访问 |
| [::]:80 | IPv6 全网段监听 |
| 192.168.0.0:80 | 允许特定网段访问 |

---

*笔记创建时间：2025/10/14 09:15:12*  
*Permalink：/notes/Linux/jy30bjng/*