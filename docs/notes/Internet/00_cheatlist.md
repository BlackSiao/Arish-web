---
title: Linux & 网络常用 CheatList
createTime: 2026/02/24 18:19:20
permalink: /notes/Internet/u719fp1c/
---

# Linux & 网络 常用 CheatList

本文件用于记录常用的排查计算机网络相关内容的命令，方便之后查看和使用
---

## 1. sar命令

```查看
sar -n DEV 1 10
# 输出中常见字段：rxkB/s（接收 KB/s），txkB/s（发送 KB/s），%ifutil (网卡带宽利用率)
08:20:21 AM     IFACE   rxpck/s   txpck/s    rxkB/s    txkB/s   rxcmp/s   txcmp/s  rxmcst/s   %ifutil
08:20:22 AM        lo  15083.00  15083.00 360209.73 360209.73      0.00      0.00      0.00      0.00
08:20:22 AM enp59s0f1np1 115125.00 249402.00  31157.66 339027.27      0.00      0.00     35.00     11.11
```

---
## 2. MTR（My Traceroute）—— 路径与丢包诊断

MTR 结合了 `ping` 与 `traceroute` 的功能，会持续发送探测包并实时更新每一跳的丢包与延迟，适合定位网络抖动与丢包点。

```bash
# 我最常使用的(会打印每一跳的ASN和具体的IP)
mtr -rzb 8.8.8.8

# 交互模式（实时，按 q 退出）
mtr 8.8.8.8

# 报告模式（适合保存/分析）
mtr -rw 8.8.8.8

# 指定探测次数（例如 20 次）
mtr -c 20 8.8.8.8
```

- 如果中间跳出现丢包但终点无丢包，通常是中间设备对 ICMP 限速（可忽略）；若终点也丢包，则为真实链路问题。
- 若第 N 跳开始持续丢包至终点，问题通常出在该跳所在运营商/机房。

## 3. ss命令
ss可以说是netstat的全方位升级，但是有时候会遇到老版本的机器没有装ss命令的，所以这里也说明一下netstat命令的常见操作

### 3.1 显示socket统计摘要
外界和应用程序通讯，其本质是和应用程序所占据的那个端口进行通信的，而这个端口就是 Socket

```
ss -s 

(预期输出)
Total: 38463
TCP:   43962 (estab 37061, closed 5761, orphaned 888, timewait 5761)   [展示TCP的连接的全部周期的统计信息]

Transport Total     IP        IPv6
RAW       1         1         0
UDP       69        69        0
TCP       38201     38078     123
INET      38271     38148     123
FRAG      0         0         0

```

### 3.2  查看Socket的 TCP 连接情况

```显示全部Socket的连接情况
ss -ant 

(预期输出)
State           Recv-Q       Send-Q              Local Address:Port                   Peer Address:Port        Process
LISTEN          0            4096                      0.0.0.0:6379                        0.0.0.0:*
LISTEN          0            4096                      0.0.0.0:80                          0.0.0.0:*
LISTEN          0            4096                      0.0.0.0:8080                        0.0.0.0:*
LISTEN          0            4096                      0.0.0.0:8880                        0.0.0.0:*
```

---
Recv-Q（接收队列积压）:
    对于 LISTEN 状态的 socket，Recv-Q 表示已完成三次握手但还没被 accept() 取走的连接数。正常的时候为0或者接近为0，如果持续 > 0，就说明
    应用程序处理的太慢，请求都被堆积在了接受缓存区里面。

Send-Q（backlog 上限）:
    对于 LISTEN 状态，Send-Q 显示的是这个 socket 配置的 accept queue 最大长度。 比如说上面就将接受缓存区设置为 4096
---

### 3，3 计算实时的重传率

```实时查看重传详情

sar -n TCP,ETCP 1 5

关键指标：retrans/s（每秒重传的 TCP 段数量）。
重传率 = 重传的数据包数量 / 总发送的数据包数量(retrans / oseg)
```

## 4.  ethtool 命令

### 4.1 查看网卡基本信息
```bash
ethtool eth0          # 网卡速率、双工模式、连接状态
ethtool -i eth0       # 驱动信息（driver version firmware-version）
ethtool -P eth0       # 查看网卡 MAC 地址
```

---

### 4.2 查看流量统计
```
ethtool -S eth0       # 网卡硬件计数器，包含rx_drop、tx_drop、CRC错误等 (这里显示的是全部的历史值)
ethtool -S eth0 | grep -i drop    # 只看丢包
ethtool -S eth0 | grep -i err     # 只看错误

```

## 5. fping 命令

ping只可以查单个IP,但fping可以对整个网段进行探活，非常的方便
```简单示例
fping -agq xx//24
```
## 参数说明
- a(Alive)是之查看存活的机器
- g(Generate)指定扫描某一个CIDR网段
- q(quiet)静默模式，会自动跳过错误的信息(不可达的IP)

## 6. iptables 命令

```查看现在的iptables策略
iptables -L -v -n
```

```ipset命令
ipset list whitelist 

# 添加网段的
ipset add/del whitelist 10.0.0.0/24
```

## 6. ip命令
在某些场景下(比如说单用户模式)，系统没有systemctl 、 service等命令，需要用最原始的 ip 命令去手动添加 IP和路由
```
ip a del 66.51.68.7/24dev ens1fnp1
ip a add 66.51.68.7/24dev ens1fnp1
ip ro add default via 66.51.68.1
---
```

## 网络相应的细碎知识点

###  网卡中断科普
```查看Linux终端情况
cat /proc/interrupts  （这里输出的信息不是给人来分析的，需要把内容丢给AI进行分析）
```

什么是网卡中断？ > 学习过电子信息，了解过时钟中断这个概念，就很好理解了

你可以把 CPU 想象成一个忙碌的经理，网卡是一个快递员。
- 数据到达： 当网卡收到网络数据包（电信号/光信号）并转换成内存里的数据。
- 发出中断： 网卡不能直接替 CPU 做决定，它会给 CPU 发一个“敲门信号”（即 中断 IRQ）。
- 处理任务： CPU 收到信号后，放下手头的工作，转去处理网卡里的数据包（拆包、协议栈转换等）。

此时如果数据包太多，CPU 就会被频繁的“敲门声”吵得没法干活，甚至某个 CPU 核心会被累死，这就是所谓的“中断不均衡”。


## 什么是 TCP 乱序？
TCP 是一个有序传输协议。假设发送方按顺序发出包 1、2、3，接收方收到的顺序却是 1、3、2。
接收方不能直接把包 3 交给应用层，必须把它放入缓存（Buffer）里“等”包 2 到了并排好序后才能提交。
如果乱序严重，会耗尽接收端的内存缓冲区，并可能导致发送方误以为包丢了，从而触发不必要的重复确认（Dup ACK）和快速重传。


## 什么是 TCP 重传率？
TCP 协议为了保证传输的可靠性，有一个“确认机制”：发送方每发一个包，接收方都要回一个 ACK（确认）。
正常情况：A 发包 -> B 收到并回 ACK -> A 发下一个包。
异常情况：A 发包后，在规定时间内没收到 ACK（可能是包丢了，也可能是 ACK 丢了），A 就会认为数据没传到，于是重新发送一遍。

