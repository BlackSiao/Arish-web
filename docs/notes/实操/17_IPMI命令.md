# IPMI 命令速查

## 🛠️ 一、IPMI 远程管理配置
IPMItool是服务器的管理接口，该接口管理和监视带外计算机系统。

它是一个命令提示符，用于控制和配置IPMI支持的设备。用于配置服务器基板管理控制器（BMC）的网络参数。 要使用IPMI命令，需要有 /dev/ipmi0 设备存在，如果缺少该设备， ipmitool 工具就无法工作

---

配置 ipmi0 设备的步骤如下:
```
# 安装    
yum  -y install epel-release    
yum  -y install ipmitool    
yum install OpenIPMI  ipmitool    
# 加载模块    
modprobe ipmi_watchdog    
modprobe ipmi_poweroff    
modprobe ipmi_devintf    
modprobe ipmi_msghandler    
modprobe ipmi_si  
```


| 步骤 | 操作命令 | 说明 |
| :--- | :--- | :--- |
| 1. 切换模式 | `ipmitool lan set 1 ipsrc static` | 必须先执行，切换为静态 IP 模式 |
| 2. 设置 IP | `ipmitool lan set 1 ipaddr 10.10.10.50` | 设置 BMC 管理地址 |
| 3. 掩码 | `ipmitool lan set 1 netmask 255.255.255.0` | 设置子网掩码 |
| 4. 网关 | `ipmitool lan set 1 defgw ipaddr 10.10.10.1` | 设置默认网关 |
| 备选（DHCP） | `sudo ipmitool lan set 1 ipsrc dhcp` | 切换回动态获取模式 |

## 🔧 二、常用远程操作

### 1. 设置下次启动从 PXE 启动

#### 一次性生效（下次开机）
```bash
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootdev pxe
```

#### 持久化生效
```bash
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootdev pxe options=persistent
```

### 2. 重启服务器
```bash
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis power reset
```

### 3. 检查电源 / 启动状态
```bash
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> chassis bootparam get 5
```

## ⚠️ 三、处理 BIOS / POST 自检卡住
当机器存在硬件报错，卡在 POST 自检时，可以通过下面命令跳过提示：

```bash
racadm get BIOS.MiscSettings
racadm set BIOS.MiscSettings.ErrPrompt Disabled
racadm jobqueue create BIOS.Setup.1-1
```

## 🔌 四、SOL 远程串口（Serial Over LAN）
对于无法使用 KVM 的机器，如果IPMI的网络是打通的，可以使用 SOL 进行远程操作。

### SOL 是什么
本质上是把服务器物理串口的数据流，通过网络转发出来。

```text
物理服务器
  CPU/主板 ─串口─→ BMC ── UDP/623 ──→ 你的电脑
```

### 关键点
- 服务器串口（如 COM1/COM2）被 BMC 接管。
- BMC 会把串口输出通过 IPMI 协议封装，并通过 UDP 623 端口转发。
- 你的输入也会被反向传回服务器串口。

### 双向特性
- 下行：服务器串口输出 → BMC → 网络 → 你
- 上行：你的键盘输入 → 网络 → BMC → 服务器串口

### 连接示例
```bash
ipmitool -I lanplus -H 10.104.0.177 -U ADMIN -P <密码> sol activate
```

