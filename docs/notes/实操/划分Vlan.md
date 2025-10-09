---
title: 划分Vlan
createTime: 2025/10/02 10:56:23
permalink: /notes/实操/76q1whm2/
---

# 创建VLAN的操作步骤

**注意：** 先进入 `system-view` 模式。

## 1. 创建新的VLAN

使用以下命令创建VLAN：

```bash
vlan batch 300
```

**说明：**  
此时刚把VLAN划出来，还没有把接口添加进去。如果某个接口还没有被分配VLAN，它会默认存在VLAN1下。

## 2. 配置端口的模式，将接口关联VLAN

- 进入端口配置模式：  
  ```bash
  interface GigabitEthernet0/0/17
  ```

- 将端口设为Access/Trunk模式（只属于一个VLAN）：  
  ```bash
  port link-type access/trunk
  ```

- 将端口默认VLAN设为300，发送/接收untagged帧：  
  ```bash
  port default vlan 300
  ```

- 返回系统视图：  
  ```bash
  quit
  ```

## 3. 销毁VLAN

使用以下命令销毁VLAN：  

```bash
undo vlan 300
```

**说明：**  
VLAN里面的接口也恢复初始化了。

## 4. 配置Vlanif

Vlanif是交换机上基于VLAN创建的逻辑接口。每个VLAN可以对应一个Vlanif接口，通过该接口可以为相应的VLAN配置IP地址，使其具备三层路由功能。

### 作用
- **实现VLAN间路由**：在传统的二层交换网络中，不同VLAN之间的主机无法直接通信。通过配置Vlanif接口并启用路由功能，交换机可以作为三层设备，实现不同VLAN之间的数据转发，使不同VLAN内的主机能够相互通信。
- **作为网关**：Vlanif接口可以为所属VLAN内的主机提供默认网关。主机将数据包发送到Vlanif接口配置的IP地址，交换机再根据路由表将数据包转发到目标网络。

### 配置步骤
- 创建Vlanif 300接口：  
  ```bash
  interface Vlanif 300
  ```

- 配置Vlanif 300的IP地址：  
  ```bash
  ip address 192.168.300.1 24
  ```

- 确认是否启用：  
  ```bash
  display interface Vlanif 300
  ```