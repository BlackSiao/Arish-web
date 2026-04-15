UDP 没有重传机制，不代表基于 UDP 的“程序”不能重传。
很多现代协议（例如谷歌推出的 QUIC，也就是 HTTP/3 的基础）虽然底层使用 UDP，但它们在应用层自己编写了一套重传逻辑：
• 序列号： 程序给每个包加个编号。
• 确认机制： 接收方告诉发送方哪些编号收到了。
• 超时重传： 如果发送方发现某个编号好久没回音，就手动再发一次。

总结
• 在传输层： 是的，丢了就彻底丢了。
• 在应用层： 如果业务需要（比如 DNS 查询或文件传输），程序员会自己写代码来确保数据完整性。


丢包通常发生在三个环节：线路上、内核里、程序中。

1.线路问题（运营商/硬件）
链路拥塞： 跨国链路（如你之前提到的巴西或美国线路）在高峰期会有严重的丢包。

2.操作系统接收缓冲区满了（最常见）
UDP 报文到达网卡后会进入内核缓冲区。如果你的程序处理速度跟不上，缓冲区填满后，后续的包会被内核直接丢弃。

3. 防火墙与安全策略
• UDP Flood 限制： 很多云厂商或机房防火墙（甚至服务器自身的 iptables/firewalld）有针对 UDP 的频率限制
（Rate Limiting）。如果你的 UDP 流量突然增大，会被识别为攻击并丢弃。

## 比如说我在工作中就遇到过因为硬盘IO不足，引发过丢包的问题


## 
TX 和 missed 解释

  TX（Transmit = 发送）

  就是这台机器向外发出去的流量。你的业务是向客户端推送数据（TX:RX = 35:1），所以带宽瓶颈在 TX 方向。

  - TX 卡在 8Gbps 的平线 = 发送带宽被限住了

  missed

  这是网卡硬件层面的计数器，表示：网卡收到了包，但来不及交给内核处理，包被丢了。

  但注意，在你这个场景下，missed 是 RX（接收）方向的指标。你的限速发生在 TX（发送）方向，所以单看 missed 不能直接证明限速。


----
日常的工作中总算是进步到要对网络协议有更加深入了解的时候了，多的也不说，就单说 TCP 、UDP、ICMP 协议

以最近在处理的 越南FPT --> VNPT的机器之间 TCP重传率很高为例


在分析丢包问题的时候，首先要明确的就是  数据包 在整个通信的过程中会经过哪些节点，然后我们通过一些测试命令、工作经验、和不同链路的工程师沟通，最终解决丢包的问题，有时候处理这种问题的时候就像是侦探在解密一样

## 1.确认丢包的问题

假设我现在在越南胡志明有一台CDN服务器，跑的是TikTok的业务，这台服务器计入在越南FPT运营商的机房里面，但是同时对VNPT，Viteel的用户也提供服务。现在客户反馈，这台机器存在高丢包的情况，要我进行排查

首先第一步就是确认客户反馈的问题是否属实:

1. 因为TCP是有纠错机制的，在完成三次握手，开始传输数据的时候，每一个数据包都有sep好，如果接收方的接受缓冲窗口里面发现发来的数据包有缺失的情况，就会发消息让发送方再次重传，其他已经传好的数据包都丢在接受缓冲窗口里面

因此在面对TCP丢包率较高的情况的时候，可以近似的将 TCP重传率 看作是 TCP丢包率；

``` 判断重传率的sh脚本
#   这段代码从 /proc/net/snmp 的 Tcp: 段读取 RetransSegs / OutSegs 两个 counter，
#   取两次采样差值，重传率 = ΔRetransSegs / ΔOutSegs
#
# 用法：
#   ./tcp_retrans_rate.sh                # 默认窗口 10s
#   ./tcp_retrans_rate.sh 30             # 自定义窗口秒数
#   ssh root@HOST 'bash -s' < tcp_retrans_rate.sh 10   # 远程执行

set -euo pipefail

WINDOW="${1:-10}"

read_snmp() {
    # 在 /proc/net/snmp 中 Tcp: 行是"表头/数值"成对出现，
    # 表头在第 N 行，数值在第 N+1 行，按列名定位列号后取值。
    awk '
        /^Tcp: [A-Za-z]/ { for (i=1; i<=NF; i++) col[$i] = i; next }
        /^Tcp: [0-9-]/   { printf "%s %s\n", $col["RetransSegs"], $col["OutSegs"]; exit }
    ' /proc/net/snmp
}

read -r r1 o1 < <(read_snmp)
t1=$(date +%s.%N)

sleep "$WINDOW"

read -r r2 o2 < <(read_snmp)
t2=$(date +%s.%N)

awk -v r1="$r1" -v o1="$o1" -v r2="$r2" -v o2="$o2" -v t1="$t1" -v t2="$t2" '
BEGIN {
    dt = t2 - t1
    dr = r2 - r1
    do_ = o2 - o1
    printf "窗口                : %.3f s\n", dt
    printf "RetransSegs  %d -> %d  (Δ=%d, %.2f/s)\n", r1, r2, dr, dr/dt
    printf "OutSegs      %d -> %d  (Δ=%d, %.2f/s)\n", o1, o2, do_, do_/dt
    if (do_ > 0)
        printf "重传率       : %.6f  (%.4f%%)\n", dr/do_, 100.0*dr/do_
    else
        print  "重传率       : N/A (ΔOutSegs=0, 窗口内无 TCP 发送)"
}'
```
---

2. 在确认机器重传率的确很高的时候，接下来要确认的就是包到底丢在哪个环境上，这就要求我们至少直到 数据包 会经过哪些链路

从用户刷短视频，此时 用户和服务器之间线进行TCP三次握手，确认连接开始

```
1. 用户 --> 服务器的网卡： 服务器的网卡接收到用户的请求，这段链路到从 用户--> VNPT --> FPT --> Server
2. 服务器内部： 
    - 服务器的网卡把对应请求发给CPU
    - CPU整理数据包： 查看内存，内存没有从硬盘里面IO出来，整合成数据包
    - 将数据包传到网卡
3. 服务器的网卡 --> 用户： Server --> FPT --> VNPT --> 用户

---总的决策树
  重传率高
    │
    ├─ Step 1: 确认方向 (入向丢 or 出向丢?)
    │   └─ ss -ti / tcpdump 抓包看 Dup ACK 方向
    │
    ├─ Step 2: 网卡层 (NIC / 驱动)
    │   └─ ethtool -S / ip -s link → rx_dropped, rx_fifo, rx_crc
    │
    ├─ Step 3: 内核协议栈
    │   ├─ 软中断 / Ring Buffer → /proc/net/softnet_stat
    │   ├─ socket buffer    → ss -m / netstat -s
    │   └─ conntrack 表满   → nf_conntrack_count vs max
    │
    ├─ Step 4: iptables / tc / qdisc
    │   └─ tc -s qdisc / nft list ruleset
    │
    ├─ Step 5: 应用层
    │   └─ accept queue 满, 业务慢导致 RTO
    │
    └─ Step 6: 都不是 → 问题在链路 (运营商/IDC)

---

丢包的问题之所以难以处理，或者说整个网络调优的问题难以处理的原因，就在于整条网络链路上一堆路由器，运营商之间或出于要赚钱，或出于法律法规，或者某个新来的实习生不会配路由器，都会导致网络链路出现毛病，我们作为服务器的拥有者，所能获取和确认的信息，
只有一部分，接下来我们要做的就是先确认自己是否存在问题

---
### 是否是服务器内部问题？

就像是刚刚说的内容，受限于服务器的性能: 硬盘IO不够，网卡处理能力不行，CPU顶不住,内存不够，方方面面都有可能导致业务丢包，那有没有什么办法可以简单的确认，丢包的原因就是出在我们服务器侧的吗？
好像也并没有那么简单的方法，我们需要遵循某一套决策树来进行处理?从外到内，逐级排查

1. 网卡物理层

  ethtool -S eth0 | grep -Ei 'err|drop|discard|fifo|crc|miss'
  ip -s -s link show eth0
  关键指标:
  - rx_crc_errors:物理层错误(网线、光模块、对端端口)→ 机房/硬件问题
  - rx_fifo_errors / rx_missed_errors:网卡 Ring Buffer 溢出 → 调大 ethtool -G eth0 rx 4096
  - rx_no_buffer_count:内核来不及处理

  2. 软中断 / RPS

  cat /proc/net/softnet_stat  # 第2列 = dropped, 第3列 = time_squeeze
  mpstat -P ALL 1             # %soft 是否打满单核
  - 单核 %soft 接近 100% → 开启 RPS/RSS,多队列分散

  3. 协议栈(最重要的入口)

  netstat -s | grep -iE 'drop|prune|collapse|listen|overflow|retrans'
  nstat -az | grep -iE 'Drop|Overflow|Prune|NoRoute'
  关键 counters:

  ┌─────────────────────────────────────┬─────────────────────────┬─────────────────────────────────────┐
  │               Counter               │          含义           │                处置                 │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ ListenOverflows / ListenDrops       │ accept queue 满         │ 调 somaxconn + 应用 accept() 不够快 │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ TCPBacklogDrop                      │ syn queue 或 backlog 满 │ 调 tcp_max_syn_backlog              │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ PruneCalled / RcvPruned / OfoPruned │ socket buffer 不够      │ 调 tcp_rmem                         │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ TCPTimeWaitOverflow                 │ TIME_WAIT 过多          │ tcp_tw_reuse                        │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ TCPReqQFullDoCookies                │ SYN 被丢                │ SYN flood 或 backlog 小             │
  ├─────────────────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
  │ IPReasmFails                        │ IP 分片重组失败         │ 检查 MTU/分片                       │
  └─────────────────────────────────────┴─────────────────────────┴─────────────────────────────────────┘

  4. Conntrack(云上/NAT 环境非常常见)

  cat /proc/sys/net/netfilter/nf_conntrack_count
  cat /proc/sys/net/netfilter/nf_conntrack_max
  dmesg | grep -i 'conntrack: table full'
  满了会直接丢包且无 TCP counter 体现,这是最容易被忽视的坑。

  5. qdisc / tc

  tc -s qdisc show dev eth0   # 看 dropped / overlimits

  6. Socket 级(具体到某条流)

  ss -tinemo 'dst 1.2.3.4'
  # retrans: 当前/总重传
  # rto, rtt, cwnd, ssthresh
  # skmem: 发送/接收缓冲占用

  7. eBPF 精准定位(你们 agent 已经有这能力)

  # bcc/bpftrace
  tcpretrans       # 哪条连接在重传
  tcpdrop          # 内核哪个函数丢的包 + 堆栈
  dropwatch -l kas # kfree_skb 调用点
  tcpdrop / dropwatch 是神器:能直接给出内核丢包的函数地址+堆栈,精确到是 tcp_v4_rcv 还是 nf_hook 还是 tcp_prune_queue。



  四、区分"服务器问题"还是"链路问题"的黄金法则

  ┌───────────────────────────────────────┬──────────────────────┐
  │                 现象                  │         指向         │
  ├───────────────────────────────────────┼──────────────────────┤
  │ 重传只集中在某个地区/某个 AS 的客户端 │ 链路(运营商)         │
  ├───────────────────────────────────────┼──────────────────────┤
  │ 重传全局均匀                          │ 自己的服务器         │
  ├───────────────────────────────────────┼──────────────────────┤
  │ 只在业务高峰出现                      │ 自己(容量/队列)      │
  ├───────────────────────────────────────┼──────────────────────┤
  │ 出向 Dup ACK 多(我方收不到对端 ACK)   │ 回程链路             │
  ├───────────────────────────────────────┼──────────────────────┤
  │ 入向 Retrans 多(对端收不到我发的)     │ 去程链路或本机发送侧 │
  ├───────────────────────────────────────┼──────────────────────┤
  │ ss 看 cwnd 被压很小但 rcv_space 很大  │ 链路丢包触发拥塞控制 │
  └───────────────────────────────────────┴──────────────────────┘












```































































