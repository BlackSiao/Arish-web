---
title: 08_snmp
createTime: 2025/10/10 21:06:52
permalink: /notes/Internet/fekunc0q/
---

### SNMP 简述

SNMP（Simple Network Management Protocol，简单网络管理协议）是一个**标准化的网络管理协议**，主要用于**监控、配置和管理网络设备**（如路由器、交换机、服务器、防火墙等）。它像设备的“体检工具”，允许用户使用API远程查询设备状态、收集数据、发送配置命令，而不需要物理访问设备。

SNMP 基于 UDP 协议(默认端口 161), 用来在管理站（监控系统）和代理(设备上的 SNMP 服务)之间传输管理信息。

#### 工作方式简单示意

- 管理站 → 代理： 管理端使用GET/SET主动来查请求数据（如 CPU 占用、接口状态）或发送配置命令。
- 代理 → 管理站： 服务端返回设备状态信息，或主动发送告警（Trap/Inform）。


### SNMP的基础工作框架
| 角色          | 英文名称                        | 功能                                                                             |
| ----------- | --------------------------- | ------------------------------------------------------------------------------ |
| **Agent**   | SNMP Agent                  | 运行在被监控设备上（例如 Linux 服务器、交换机、路由器）。负责收集本机信息（CPU、内存、网卡等），并响应管理端的 SNMP 请求。          |
| **Manager** | SNMP Manager                | 管理中心（例如 Zabbix Server、LibreNMS、Cacti、或 `snmpwalk` 命令所在的主机）。它向 Agent 发送请求并收集数据。 |
| **MIB**     | Management Information Base | 定义 SNMP 对象（OID）和数据结构的“字典”。                                                     |

### 什么是snmpd？
snmpd 是 Net-SNMP 项目中的 SNMP Agent 守护进程（SNMP Daemon）。

它运行在被监控的机器上。默认监听 UDP 端口 161。向管理端提供系统信息。
所以，snmpd 就是 SNMP Agent。

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

## snmpwalk
snmpwalk 是 SNMP（Simple Network Management Protocol）工具套件里的一个命令行工具，用来批量获取设备的 SNMP 数据。

当我们拿到一台服务器后，厂商没有提供SNMP的接口说明文档，那就可以自己使用snmpwalk命令一次性把设备上某个节点下的所有指标“爬下来”，像走迷宫一样遍历整个树结构

###  工作原理
1. SNMP 设备有一个 MIB（管理信息库）
* MIB 是设备可监控指标的集合
* 每个指标都有一个 OID（Object Identifier）
* 例如：1.3.6.1.2.1.1.5.0 可能表示设备名

2. snmpwalk 批量查询

* snmpwalk 会从你指定的 OID 开始，递归遍历下层的所有 OID
* 返回每个 OID 对应的值

```命令格式示例
snmpwalk -v 2c -c public 192.168.1.1
snmpwalk -v 2c -c public -On 172.16.20.27 #把MIB写成OID
```