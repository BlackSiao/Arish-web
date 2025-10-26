---
title: other
createTime: 2025/10/14 09:15:12
permalink: /notes/Linux/jy30bjng/
---


- 
```ps的时候出来的color是啥
[root]# ps aux|grep snmpd
root      100815  0.0  0.0  19192  7012 ?        S    09:15   0:01 /usr/local/sbin/snmpd -p /var/net-snmp/snmpd.pid
root      473487  0.0  0.0   6380  2240 pts/2    S+   10:15   0:00 grep --color=auto snmpd
```
所谓的grep --color=snmpd只是因为使用grep的时候顺带调用了grep语法。

grep --color=auto 是 grep 命令的一种常见用法，目的是 高亮显示匹配到的内容，方便查看。和想要过滤的配置没有任何关系。

# ps aux显示了哪些东西
- root 86967  0.0  0.0  19184 7000 ?    S Oct10  1:09  /usr/local/sbin/snmpd -p /var/net-snmp/snmpd.pid
       │       │    │      │     │   │     │      └─ 启动命令
       │       │    │      │     │   │     └─ CPU占用总时间
       │       │    │      │     │   └─ 进程状态（后台睡眠）
       │       │    │      │     └─ 没有关联终端
       │       │    │      └─ RSS（约 7 MB 实际内存）
       │       │    └─ VSZ（占用 19 MB 虚拟空间）
       │       └─ 内存百分比 0.0%
       └─ CPU百分比 0.0%

# ps -ef
有时候会需要看某个进程对应的父进程(PPID)，使用ps -ef(e-everything, f-full format)
```
arish@LAPTOP-5SC95QR5:~$ ps -ef
UID          PID    PPID  C STIME TTY          TIME CMD
root           1       0  7 21:41 ?        00:00:00 /sbin/init
root           2       1  0 21:41 ?        00:00:00 /init
```

## 什么是进程、fork()、父子进程关系

在这个地方，我将程序这个概念和进程作等号，也就是提到ps aux后存在对应pid的进程。
之所以要了解父子进程的概念，也是从实际上回忆我当时学OS的时候看到的知识点

### 父子进程
在 Linux 中，一切进程都来自 init/systemd (PID=1)，通过不断 fork 演变而来。

- 父进程: 使用fork()命令创建其他进程的进程。
- 子进程: 被父进程fork()出来的进程。

子进程受父进程控制，也是父进程的复制，当父进程被回收后，也会同时回收所有的子进程所占的系统资源。

#### 对应Linux系统中的父子进程

可以通过(pstree -p)命令来看到现在运行的操作系统中全部的父子关系
```
[root@localhost sbin]# pstree -p | grep nginx
           |-nginx(22605)-+-nginx(27796)
           |              `-nginx(27797)
```
上述内容中，可以很清楚的看到: 父进程是22605,他fork出了两个子进程27796和27797

如果还不够明显，可以通过 ps aux|grep nginx 命令，再次确认22605是父进程(master)
```
[root@localhost sbin]# ps aux|grep nginx
root       22605  0.0  0.0   8756  5732 ?        Ss   Oct14   0:00 nginx: master process /usr/local/appsys/normal/package/nginx/sbin/nginx
appuser    27796  0.0  0.0   9580  6848 ?        S    Oct14   0:00 nginx: worker process
appuser    27797  0.0  0.0  10604  6848 ?        S    Oct14   0:00 nginx: worker process
```

#### 为什么父子进程名字都一样呢？
因为当启动 nginx程序 时，它会：

1️⃣ 启动主进程（Master） ➝ 负责管理、加载配置、控制子进程
2️⃣ fork 创建多个子进程（Worker） ➝ 负责真正处理客户端请求

所有这些进程都是由同一个可执行文件 /usr/sbin/nginx 生成的，所以进程名字都叫 nginx，但功能完全不同。

#### 什么是僵尸进程(defunct)
僵尸进程指的是，当某一进程在执行完成后(通过exit系统调用、运行时发生致命错误、或收到了终止信号)，此时仍然在操作系统的进程表中保存着自己的进程控制块，处于“终止状态”的进程。

该进程已经回收了自己的pid，但是其仍然占据着系统资源，一般情况下，当子进程执行完毕后，应当被父进程调用wait系统调用回收。

#### 查看僵尸进程
```
[root@localhost sbin]# ps aux | grep defunct
admin    1568740  0.0  0.0      0     0 pts/0    Z    Oct15   0:00 [clish] <defunct>
```

在了解如何查看父子进程关系后，如果碰到僵尸地址占用了系统资源，我们就可以通过直接回收父进程，来回收僵尸进程占用的系统资源。

收割僵尸进程的方法是通过kill命令手工向其父进程发送SIGCHLD信号。如果其父进程仍然拒绝收割僵尸进程，则终止父进程，使得init进程收养僵尸进程。init进程周期执行wait系统调用收割其收养的所有僵尸进程。

## ss -lntp查看进程监听的端口

|参数|含义|
|----|----|
|-l|只显示监听（LISTEN）的端口|
|-n|不解析域名/IP，直接显示数字|
|-t|只显示 TCP 连接|
|-p|显示占用该端口的进程（PID/程序名）|

```输出示例
LISTEN  0  128  0.0.0.0:80     0.0.0.0:*    users:(("nginx",pid=1204,fd=6))
LISTEN  0  100  127.0.0.1:3306 0.0.0.0:*    users:(("mysqld",pid=1563,fd=10))
```
如果在启动某些服务时候，报错为端口已被占用，使用该命令可以轻松看出80端口被nginx占用了，3306端口被mysqld占用了。

### 从端口中，也可以看出程序监听的是公网还是本地

|监听地址|说明|
|------|------|
|127.0.0.1:3306|只允许本机访问|
|0.0.0.0:3306|允许外部访问|
|[::]:80|IPv6 下全网段监听|
|192.16.0.0：80|允许对应网址/网段访问|

