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


# 板卡和千兆电口卡
“千兆电口卡”通常指 千兆以太网网卡（Gigabit Ethernet NIC），并且接口类型为电口（RJ45 接口），也就是使用网线（双绞线）的网口卡。

- “板卡”是一个更 宽泛 的术语，常用于通信、服务器、交换机等领域，指任何可以插入主机或机箱、实现特定功能的 电路板模块。

|板卡类型|作用|
|--------|---|
|网卡|提供网络接口（电口/光口）|
|接口板 / 扩展板|增加串口、USB、CAN 等接口|
|业务板|在交换机/路由器中承担转发、处理功能|