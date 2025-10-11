---
title: snmp
createTime: 2025/10/10 21:06:52
permalink: /notes/Internet/fekunc0q/
---

### SNMP 简述

SNMP（Simple Network Management Protocol，简单网络管理协议）是一个**标准化的网络管理协议**，主要用于**监控、配置和管理网络设备**（如路由器、交换机、服务器、防火墙等）。它像设备的“体检工具”，允许用户使用API远程查询设备状态、收集数据、发送配置命令，而不需要物理访问设备。

SNMP 基于 UDP 协议(默认端口 161), 用来在管理站（监控系统）和代理(设备上的 SNMP 服务)之间传输管理信息。

#### 工作方式简单示意

- 管理站 → 代理： 请求数据（如 CPU 占用、接口状态）或发送配置命令。
- 代理 → 管理站： 返回设备状态信息，或主动发送告警（Trap）。

### SNMP 的核心用途
**监控设备状态**：通过查询 OID（Object Identifier，对象标识符，获取实时指标。一个指标对应一个特定的OID。比如：
   - 硬件状态（CPU/内存使用率、温度）。
   - 网络性能（流量、丢包率）。
   - 应用日志（错误计数、负载平均）。
   这在企业网络中超级常见，用于警报（如内存超阈值时发通知）。
```zdns_snmp的运行日志
2025-10-09 18:07:36 info msgid:25 oid: 1.3.6.1.4.1.39810.100.1.19.0
2025-10-09 18:07:36 info msgid:25 response of DDI snmp request {"ret":0}
2025-10-09 18:07:36 info msgid:25 oidValue: 0
```
- **日志中的 OID 查询**：如 `response of DDI snmp request {"ret":"0.0"}`，这是 SNMP 代理响应上层监控系统的 GET 请求。

上述日志只查询了一个OID，即oid: 1.3.6.1.4.1.39810.100.1.19.0

OID 本身是点分隔的数字序列（dotted decimal notation），这是 SNMP 标准格式，用于表示层次结构（像文件路径：1.3.6.1 是全球标准前缀，.4.1 是私有企业分支，.39810 是 KNET 公司的企业号，.100.1.19.0 是自定义子树）。点（.）分隔每个层级，整个字符串是一个唯一标识符。

- response of DDI snmp request {"ret":0} 是**服务端（SNMP 代理，如 snmpd 进程）**对客户端（管理站，如 Zabbix）查询的回应。

- msgid:25 表示是第25次会话。


### 管理站的查询方式
管理站（如 Zabbix、Nagios 或 Prometheus）不是使用 API（如 RESTful HTTP）查询的，而是直接用 SNMP 协议（通常 UDP 端口 161）发送 GET/SET 请求到设备代理（snmpd）。SNMP 是轻量级协议，专为网络管理设计：管理站发 PDU（Protocol Data Unit）包查询 OID，代理返回 ASN.1 编码数据

