---
title: 10_traceroute和ICMP报文
createTime: 2026/03/14 14:43:54
permalink: /notes/Internet/2sj6tv38/
---

# traceroute 与 ICMP 报文原理总结

## ICMP 报文格式

| Bits | 0–7   | 8–15  | 16–23    | 24–31         |
|------|-------|-------|----------|---------------|
| 0    | Type  | Code  | Checksum |               |
| 32   |           Rest of Header                |

## TTL 字段简介

TTL（Time To Live，生存时间）是 IPv4 报头的 8 位字段，指定 IP 包在被路由器丢弃前允许经过的最大跳数。TTL 的作用是防止数据包在网络中无限循环。常见初始值为 64，最大为 255。

## traceroute 的两种实现方式

1. 基于 UDP 报文
2. 基于 ICMP 报文

---

## 一、基于 ICMP 的 traceroute 原理

假设路径如下：

客户端(192.168.1.1) → 路由器A(12.1.2.1) → 路由器B(13.1.2.1) → 目标(8.8.8.8)

1. 客户端发送 TTL=1 的 ICMP 回显请求（ping）。第 1 跳路由器 TTL-1=0，丢弃数据包并返回 TTL 超时 ICMP 报文。客户端据此获得第 1 跳 IP，并可计算延迟。
2. 客户端未收到回显应答，继续发送 TTL=2 的 ICMP 报文。第 2 跳路由器 TTL 归零后丢弃数据包并返回 TTL 超时 ICMP 报文，客户端获得第 2 跳 IP。
3. 依次递增 TTL，直到数据包到达目标主机。目标主机收到 ICMP 回显请求后，返回 ICMP 回显应答，traceroute 结束。

> 基于 ICMP 的 traceroute 与 UDP 类似，区别在于直接使用 ICMP 报文，适用于部分只允许 ICMP 的网络环境。

## 二、基于 UDP 的 traceroute 原理

假设路径如下：


客户端(192.168.1.1) → 路由器A(12.1.2.1) → 路由器B(13.1.2.1) → 目标(8.8.8.8)
--

1. 客户端执行 traceroute 命令时，会向目标 IP 发送 UDP 报文，端口号通常大于 30000（避免与常用端口冲突）。
2. 第一次发送时，TTL=1。第 1 跳路由器收到后，TTL-1=0，丢弃数据包，并向客户端返回 TTL 超时的 ICMP 报文。客户端据此获得第 1 跳路由器的 IP。
3. 客户端未收到“端口不可达”ICMP 报文，继续发送下一个 UDP 报文，端口号+1，TTL+1。第 2 跳路由器 TTL 归零后丢弃数据包并返回 TTL 超时 ICMP 报文。
4. 如此循环，直到数据包到达目标主机。目标主机发现端口不可达，返回“端口不可达”ICMP 报文，traceroute 结束。

> 通过每一跳返回的 TTL 超时 ICMP 报文，traceroute 能逐步获知到目标主机路径上的所有路由器 IP。
>
> 若中间节点屏蔽 ICMP（如 iptables 禁 ping），则该节点 IP 会显示为“***”。

---

### MTR命令




---

### 总结

traceroute 通过逐步递增 TTL，利用路由器返回的 TTL 超时 ICMP 报文，逐跳探测到目标主机的路径。无论基于 UDP 还是 ICMP，核心机制都是 TTL 字段和 ICMP 报文。