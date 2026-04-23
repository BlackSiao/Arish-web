## TCP 三次握手 & 四次挥手 + ss -ant 状态详解

  ---
  一、三次握手（建立连接）

  客户端                          服务端
    |                               |
    |--- SYN (seq=x) -------------->|   客户端: SYN_SENT
    |                               |   服务端: SYN_RCVD (收到SYN后)
    |<-- SYN+ACK (seq=y, ack=x+1)--|
    |                               |
    |--- ACK (ack=y+1) ------------>|   双方: ESTABLISHED
    |                               |

  ┌──────┬────────┬─────────┬─────────────┬─────────────┐
  │ 步骤 │ 发送方 │  报文   │ 发送方状态  │ 接收方状态  │
  ├──────┼────────┼─────────┼─────────────┼─────────────┤
  │ 1    │ 客户端 │ SYN     │ SYN_SENT    │ LISTEN      │
  ├──────┼────────┼─────────┼─────────────┼─────────────┤
  │ 2    │ 服务端 │ SYN+ACK │ SYN_RCVD    │ SYN_SENT    │
  ├──────┼────────┼─────────┼─────────────┼─────────────┤
  │ 3    │ 客户端 │ ACK     │ ESTABLISHED │ ESTABLISHED │
  └──────┴────────┴─────────┴─────────────┴─────────────┘

  为什么是三次而不是两次？
  防止历史失效连接请求突然到达服务端被误处理。两次握手服务端无法确认客户端的接收能力。

  ---
  二、四次挥手（关闭连接）

  主动关闭方(A)                   被动关闭方(B)
    |                               |
    |--- FIN (seq=u) -------------->|   A: FIN_WAIT_1
    |                               |   B: CLOSE_WAIT (有数据可继续发)
    |<-- ACK (ack=u+1) ------------|   A: FIN_WAIT_2
    |                               |
    |        ... B继续发数据 ...     |
    |                               |
    |<-- FIN (seq=v) ---------------|   B: LAST_ACK
    |                               |
    |--- ACK (ack=v+1) ------------>|   A: TIME_WAIT (等2MSL)
    |                               |   B: CLOSED
    |   (2MSL超时后)                |
    | CLOSED                        |

  为什么挥手是四次？
  TCP是全双工的，FIN只关闭一个方向。B收到FIN后，自己可能还有数据没发完（CLOSE_WAIT），所以ACK和FIN分开发，共四次。

  TIME_WAIT 为什么等 2MSL？
  - MSL = Maximum Segment Lifetime（通常60s，Linux默认）
  - 确保最后一个ACK能到达对端（若丢失，B会重发FIN，A能再次ACK）
  - 让网络中残留的旧报文自然消亡，避免影响新连接

  ---
  三、ss -ant 全部状态及对应阶段

  ss -ant   # -a=all, -n=numeric, -t=tcp

  ┌─────────────┬────────────┬──────────────────────────────┐
  │    状态     │ 出现在哪方 │           对应阶段           │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ LISTEN      │ 服务端     │ 等待连接（握手前）           │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ SYN-SENT    │ 客户端     │ 握手第1步后，等待SYN+ACK     │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ SYN-RECV    │ 服务端     │ 握手第2步后，等待最终ACK     │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ ESTABLISHED │ 双方       │ 连接建立，正常通信中         │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ FIN-WAIT-1  │ 主动关闭方 │ 发出FIN，等待ACK             │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ FIN-WAIT-2  │ 主动关闭方 │ 收到ACK，等待对端FIN         │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ CLOSE-WAIT  │ 被动关闭方 │ 收到FIN并ACK，自己还没发FIN  │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ LAST-ACK    │ 被动关闭方 │ 发出FIN，等待最终ACK         │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ TIME-WAIT   │ 主动关闭方 │ 收到FIN并ACK，等待2MSL       │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ CLOSED      │ 双方       │ 连接完全关闭（ss一般不显示） │
  ├─────────────┼────────────┼──────────────────────────────┤
  │ CLOSING     │ 双方       │ 双方同时发FIN（罕见）        │
  └─────────────┴────────────┴──────────────────────────────┘

  ▎ CLOSE-WAIT 积压是线上常见故障：服务端收到了FIN但代码没有关闭socket，连接停在此状态堆积，最终耗尽文件描述符。

  ---
  四、tcpdump 抓包对照

  # 抓 80 端口的 TCP 包，看 flags
  tcpdump -i eth0 -nn 'tcp port 80' -S

  # 精简输出含义：
  # Flags [S]   = SYN
  # Flags [S.]  = SYN+ACK  (. 代表 ACK)
  # Flags [.]   = ACK only
  # Flags [P.]  = PSH+ACK  (数据传输)
  # Flags [F.]  = FIN+ACK
  # Flags [R]   = RST (强制重置)

  典型抓包输出（三次握手）：
  client > server: Flags [S],  seq 1000
  server > client: Flags [S.], seq 2000, ack 1001
  client > server: Flags [.],  ack 2001

  四次挥手：
  client > server: Flags [F.], seq 5000, ack 3000
  server > client: Flags [.],  ack 5001          ← ACK
  server > client: Flags [F.], seq 3000, ack 5001 ← FIN
  client > server: Flags [.],  ack 3001          ← 最终ACK → 进入TIME_WAIT

  ---
  五、状态机全图

                      ┌─────────┐
                      │ CLOSED  │
                      └────┬────┘
                被动打开 ↓       ↑ 主动关闭
                      ┌────▼────┐
                      │ LISTEN  │
                      └────┬────┘
                收SYN ↓
            ┌─────────────┐      主动打开
            │  SYN_RCVD   │←─────────────── SYN_SENT
            └──────┬──────┘                    ↑
          收ACK ↓             发SYN
            ┌──────▼──────────────────────────┐
            │           ESTABLISHED            │
            └──────┬──────────────┬───────────┘
      主动关闭↓发FIN             ↓收FIN
         FIN_WAIT_1          CLOSE_WAIT
             ↓收ACK               ↓发FIN
         FIN_WAIT_2           LAST_ACK
             ↓收FIN               ↓收ACK
          TIME_WAIT ──2MSL──→  CLOSED

  ---
  实际排查建议：
  - ss -ant | grep -c ESTABLISHED — 查当前活跃连接数
  - ss -ant | grep CLOSE_WAIT — 排查连接泄漏
  - ss -ant | grep TIME_WAIT | wc -l — TIME_WAIT过多说明短连接频繁，考虑开启 tcp_tw_reuse





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


----
 TCP重传的触发条件是：发送方发出的数据包在超时时间内没有收到对端的 ACK。

  这意味着：
  1. 双方已完成三次握手，连接处于 ESTABLISHED 状态
  2. 发送方发出数据段，启动重传计时器（RTO）
  3. RTO 超时或收到 3个重复 ACK（Fast Retransmit），触发重传


 例外情况：握手阶段也会重传

  ┌──────────────┬───────────────────────────────────────────────────────────┐
  │     场景     │                           说明                            │
  ├──────────────┼───────────────────────────────────────────────────────────┤
  │ SYN 重传     │ 客户端发出 SYN 没收到 SYN-ACK，会重传 SYN（连接还没建立） │
  ├──────────────┼───────────────────────────────────────────────────────────┤
  │ SYN-ACK 重传 │ 服务端发出 SYN-ACK 没收到 ACK，会重传 SYN-ACK             │
  ├──────────────┼───────────────────────────────────────────────────────────┤
  │ FIN 重传     │ 关闭阶段 FIN 未被 ACK 也会重传                            │
  └──────────────┴───────────────────────────────────────────────────────────┘


# 更细粒度：区分 SYN 重传 vs 数据重传
  netstat -s | grep -E "segments retransmited|TCPSynRetrans"

···
root@debian:~# netstat -s | grep -E "segments retransmited|TCPSynRetrans"
    TCPSynRetrans: 635
root@debian:~#
···

  # 抓包确认
  tcpdump -i eth0 'tcp[tcpflags] & tcp-rst != 0' -w /tmp/cap.pcap


#  确认和本机建立TCP连接的全部IP
```
ss -tn state established
```

+++
root@VNHN-FPT-F04-14:~# ss -tn state established
Recv-Q         Send-Q                       Local Address:Port                        Peer Address:Port        Process
0              0                           58.186.119.226:18785                      118.69.17.152:443
0              0                           58.186.119.226:64119                        23.32.74.32:443
0              0                           58.186.119.226:21967                      118.69.17.170:443
0              0                           58.186.119.226:9502                      113.173.209.77:58045
0              0                           58.186.119.226:9502                        14.234.89.19:54751
0              0                           58.186.119.226:9502                     113.178.111.249:54968
0              0                           58.186.119.226:9502                     116.109.141.131:53363
0              0                           58.186.119.226:9502                       14.186.91.236:64438

+++
Recv-Q

  接收缓冲区中已收到但应用程序还没有 read() 走的字节数。

  - 正常情况应该接近 0
  - 持续偏高 → 说明应用程序处理太慢，数据堆在内核缓冲区里没被消费

  Send-Q

  发送缓冲区中已发送但还没收到对端 ACK 的字节数（即"在途"数据）。

  - 正常情况波动但接近 0
  - 持续偏高 → 说明对端接收慢或网络有问题，数据发出去但 ACK 迟迟不回

  和 TCP 重传的关联

  Send-Q 持续高  →  对端 rwnd 满 或 网络拥塞
                    →  发送方被迫等待
                    →  超时后触发重传
+++
```

判断出具体丢包的网段后，就可以进一步查看丢包的内容了： 

 # mtr 是最好用的工具，同时看路由 + 丢包 + 延迟
  mtr -zbn --report --report-cycles 60 113.185.87.1

 # 抓取和这个网段之间的 TCP 流量，重点看重传
  tcpdump -i eth0 -w /tmp/retrans_113.pcap \
    'net 113.185.87.0/24 and tcp'

---
排查的脚本:

 #!/bin/bash
  # tcp_diag.sh — TCP 丢包一键诊断
  # 用法: ./tcp_diag.sh [目标IP或网段]

  TARGET="${1:-}"
  IFACE="${2:-$(ip route | awk '/default/{print $5; exit}')}"

  echo "============================================"
  echo " TCP 丢包诊断报告 $(date)"
  echo " 网卡: $IFACE  目标: ${TARGET:-全量}"
  echo "============================================"

  # ── 1. 重传率（10s 采样）──────────────────────
  echo -e "\n[1] TCP 重传率（10s 窗口）"
  read_snmp() {
      awk '/^Tcp: [0-9]/{print $13, $11}' /proc/net/snmp
  }
  read r1 o1 < <(read_snmp); sleep 10; read r2 o2 < <(read_snmp)
  awk -v r1=$r1 -v o1=$o1 -v r2=$r2 -v o2=$o2 'BEGIN{
      dr=r2-r1; do_=o2-o1
      printf "  RetransSegs Δ=%-6d  OutSegs Δ=%-8d  重传率=%.4f%%\n",
          dr, do_, (do_>0 ? 100.0*dr/do_ : 0)
  }'

  # ── 2. 网卡错误 ───────────────────────────────
  echo -e "\n[2] 网卡物理层错误 ($IFACE)"
  ethtool -S $IFACE 2>/dev/null | \
      grep -Ei 'err|drop|discard|fifo|crc|miss|overflow' | \
      awk '$2>0{printf "  %-40s %d\n", $1, $2}' | head -20
  ip -s -s link show $IFACE | grep -A2 "RX:"

  # ── 3. 软中断 / softnet ───────────────────────
  echo -e "\n[3] 软中断 Dropped / Time_squeeze"
  awk 'NR<=8{
      dropped=strtonum("0x"$2)
      squeezed=strtonum("0x"$3)
      if(dropped>0||squeezed>0)
          printf "  CPU%-2d  dropped=%-8d time_squeeze=%d\n", NR-1, dropped, squeezed
  }' /proc/net/softnet_stat

  # ── 4. 协议栈关键 counter ─────────────────────
  echo -e "\n[4] 内核协议栈丢包 counter"
  nstat -az 2>/dev/null | awk '
      /ListenOver|ListenDrop|BacklogDrop|PruneCalled|RcvPruned|
       OfoPruned|TimeWait|SynRetrans|ReasmFail|ConntrackFull/{
          if($2>0) printf "  %-35s %d\n", $1, $2
      }'
  # fallback
  netstat -s 2>/dev/null | grep -iE 'overflow|prune|drop|retransmit' | \
      grep -v "^$" | sed 's/^/  /'

  # ── 5. Conntrack 使用率 ───────────────────────
  echo -e "\n[5] Conntrack 表使用率"
  ct_cur=$(cat /proc/sys/net/netfilter/nf_conntrack_count 2>/dev/null || echo 0)
  ct_max=$(cat /proc/sys/net/netfilter/nf_conntrack_max 2>/dev/null || echo 1)
  pct=$((ct_cur * 100 / ct_max))
  echo "  $ct_cur / $ct_max  (${pct}%)"
  [ $pct -gt 80 ] && echo "  ⚠️   WARNING: conntrack 使用率超 80%，高风险丢包"

  # ── 6. Accept Queue 溢出 ──────────────────────
  echo -e "\n[6] Listen 状态 socket（Recv-Q > 0 说明 accept queue 积压）"
  ss -lnt | awk 'NR==1||$2>0{print "  "$0}'

  # ── 7. SYN 重传（连接建立失败）────────────────
  echo -e "\n[7] SYN 重传数"
  grep TCPSynRetrans /proc/net/netstat 2>/dev/null | \
      awk 'NR==2{print "  TCPSynRetrans:", $NF}'

  # ── 8. 热点连接（Send-Q 积压）────────────────
  echo -e "\n[8] Send-Q 积压的连接（发送拥塞）"
  ss -tn state established | awk '$2>0{print "  "$0}' | head -10

  # ── 9. 针对目标网段（如果指定了）────────────
  if [ -n "$TARGET" ]; then
      echo -e "\n[9] 目标 $TARGET 的活跃连接"
      ss -tin "dst $TARGET" | grep -E 'retrans|rtt|cwnd|ssthresh' | \
          sed 's/^/  /'

      echo -e "\n[10] mtr 路由追踪（10次，后台运行，结果写 /tmp/mtr_$$.txt）"
      mtr -zbn --report --report-cycles 10 $(echo $TARGET | cut -d/ -f1) \
          > /tmp/mtr_$$.txt 2>&1 &
      echo "  PID $!  结果: /tmp/mtr_$$.txt"
  fi

  # ── 10. 综合判断 ──────────────────────────────
  echo -e "\n============================================"
  echo " 初步判断"
  echo "============================================"

  # 读协议栈关键值做简单决策
  listen_drop=$(nstat -az 2>/dev/null | awk '/ListenDrop/{print $2}')
  prune=$(nstat -az 2>/dev/null | awk '/PruneCalled/{print $2}')
  syn_retrans=$(grep TCPSynRetrans /proc/net/netstat 2>/dev/null | awk 'NR==2{print $NF}')

  [ "${listen_drop:-0}" -gt 0 ] && \
      echo "  ⚠️   ListenDrop>0 → accept queue 满，应用处理慢或 somaxconn 太小"
  [ "${prune:-0}" -gt 0 ] && \
      echo "  ⚠️   PruneCalled>0 → socket buffer 不足，考虑调大 tcp_rmem"
  [ "${syn_retrans:-0}" -gt 100 ] && \
      echo "  ⚠️   SYN重传>100 → 存在连接建立失败，检查 backlog 或上游链路"
  [ $pct -gt 80 ] && \
      echo "  ⚠️   Conntrack 高水位，NAT/防火墙环境下会静默丢包"

  echo "  ℹ️   若以上均正常 → 问题大概率在上游链路（运营商/IDC对端）"
  echo ""





























































