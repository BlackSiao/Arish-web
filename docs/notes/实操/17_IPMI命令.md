--

## 🛠️ 一、 IPMI 远程管理配置
用于配置服务器基板管理控制器 (BMC) 的网络。

| 步骤 | 操作命令 | 说明 |
| :--- | :--- | :--- |
| **1. 切换模式** | `ipmitool lan set 1 ipsrc static` | **必需先执行**，切换为静态 IP 模式 |
| **2. 设置 IP** | `ipmitool lan set 1 ipaddr 10.10.10.50` | 设置 BMC 管理地址 |
| **3. 掩码** | `ipmitool lan set 1 netmask 255.255.255.0` | 设置子网掩码 |
| **4. 网关** | `ipmitool lan set 1 defgw ipaddr 10.10.10.1` | 设置默认网关 |
| **备选 (DHCP)** | `sudo ipmitool lan set 1 ipsrc dhcp` | 切换回动态获取模式 |

# 设置一次性从 PXE 启动（下次开机生效一次）
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootdev pxe

# 或者持久化
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootdev pxe options=persistent

# 重启服务器
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis power reset

# 检查电源/启动状态
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootparam get 5

# 当机器存在硬件报错，卡在Post自检的时候，可以通过以下命令来跳过:
racadm get BIOS.MiscSettings
racadm set BIOS.MiscSettings.ErrPrompt Disabled
racadm jobqueue create BIOS.Setup.1-1

ipmitool -I lanplus -H 10.104.0.177 -U admin -P a chassis power reset


对于无法使用KVM的机器，如果网络打通的话，还可以使用SOL来进行远程操作
SOL (Serial Over LAN) 是什么

  本质

  把服务器物理串口的字节流，通过网络转发出来。 简单的概念图：

  ┌─────────────────────────────────┐
  │  物理服务器                     │
  │                                 │
  │  CPU/主板 ─串口─→ ┌─────────┐  │
  │                   │   BMC    │  │   ipmitool sol activate
  │                   │ (独立芯片)│  │←─────────────────────  你的电脑
  │                   └────┬─────┘  │   UDP/623 (IPMI协议)
  │                        │        │
  └────────────────────────┼────────┘
                           │
                         网卡

  服务器的串口（COM1/COM2，理论上是你能拔出真实RS-232线的那个口）被BMC"截胡"了，BMC把串口的输出通过IPMI协议封装、走UDP
  623端口发出来；你的输入也反向通过同样的通道送回服务器串口。

  SOL是双向的：
  - 下行：服务器串口的输出 → BMC → 网络 → 你
  - 上行：你的键盘输入 → 网络 → BMC → 服务器串口