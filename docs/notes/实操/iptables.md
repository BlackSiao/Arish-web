---
title: iptables
createTime: 2025/10/09 10:22:36
permalink: /notes/实操/wznst2i7/
---
# iptables 配置脚本

## 1️⃣ 清理旧规则并设置默认策略

```bash
iptables -F
iptables -X
iptables -Z
ip6tables -F
ip6tables -X

iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

## 2️⃣ 放行本地回环

```bash
iptables -A INPUT -i lo -j ACCEPT
ip6tables -A INPUT -i lo -j ACCEPT
```

## 3️⃣ 允许已建立连接回包

```bash
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
```

## 4️⃣ 禁用 DNS 流量连接跟踪 (raw表)

```bash
iptables -t raw -A PREROUTING -p udp --dport 53 -j NOTRACK
iptables -t raw -A PREROUTING -p udp --sport 53 -j NOTRACK
iptables -t raw -A OUTPUT -p udp --dport 53 -j NOTRACK
iptables -t raw -A OUTPUT -p udp --sport 53 -j NOTRACK

iptables -t raw -A PREROUTING -p tcp --dport 53 -j NOTRACK
iptables -t raw -A PREROUTING -p tcp --sport 53 -j NOTRACK
iptables -t raw -A OUTPUT -p tcp --dport 53 -j NOTRACK
iptables -t raw -A OUTPUT -p tcp --sport 53 -j NOTRACK
```

## 5️⃣ 核心业务端口放行

```bash
# DNS
iptables -A INPUT -p udp --dport 53 -j ACCEPT
iptables -A INPUT -p tcp --dport 53 -j ACCEPT
iptables -A INPUT -p udp --sport 53 -j ACCEPT
iptables -A INPUT -p tcp --sport 53 -j ACCEPT

# NTP
iptables -A INPUT -p udp --dport 123 -j ACCEPT
iptables -A INPUT -p udp --sport 123 -j ACCEPT

# VRRP / OSPF
iptables -A INPUT -p vrrp -j ACCEPT
iptables -A INPUT -p ospf -j ACCEPT

# DHCP (如为DNS集成DHCP场景)
iptables -A INPUT -p udp --dport 67:68 -j ACCEPT
iptables -A INPUT -p udp --sport 67:68 -j ACCEPT

# Asterisk/SIP或健康探测端口 (4569)
iptables -A INPUT -p udp --dport 4569 -j ACCEPT
iptables -A INPUT -p tcp --dport 4569 -j ACCEPT
iptables -A INPUT -p udp --sport 4569 -j ACCEPT
iptables -A INPUT -p tcp --sport 4569 -j ACCEPT
```

## 6️⃣ 管理访问控制 (SSH/HTTPS)

```bash
# 本地管理
iptables -A INPUT -s 127.0.0.1/32 -p tcp -m multiport --dports 22,443 -j ACCEPT

# 内部运维网段
iptables -A INPUT -s 192.168.1.0/24 -p tcp -m multiport --dports 22,443 -j ACCEPT

# 其他管理节点 (根据现场配置汇总)
for ip in \
  10.20.64.177 10.20.91.56 10.20.6.228 10.28.0.53 10.20.36.99 \
  10.21.144.40 10.21.151.251 10.12.111.227 10.20.6.203 \
  10.21.111.227 10.16.20.192 10.20.45.220 10.28.91.241 \
  10.28.131.72 172.18.41.221 172.18.1.24
do
  iptables -A INPUT -s $ip/32 -p tcp -m multiport --dports 22,443 -j ACCEPT
done

# 信任节点
iptables -A INPUT -s 172.18.1.31/32 -j ACCEPT
iptables -A INPUT -s 172.18.1.32/32 -j ACCEPT
iptables -A INPUT -s 172.18.1.93/32 -j ACCEPT
```

## 7️⃣ ICMP控制与安全增强

```bash
iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s -j ACCEPT
iptables -A INPUT -p icmp --icmp-type 13 -j DROP
iptables -A INPUT -p icmp --icmp-type 14 -j DROP
```

## 8️⃣ 日志与拒绝策略

```bash
iptables -A INPUT -j LOG --log-prefix "iptables denied: " --log-level 7
iptables -A INPUT -j DROP
```