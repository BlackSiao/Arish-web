---
title: 08_UUID
createTime: 2026/02/10 11:15:10
permalink: /notes/Linux/elmer6de/
---

# UUID 全面理解

本文用于澄清 Linux 中不同“UUID”的来源、作用与设计动机，避免概念混淆,大家当科普看吧

---

## 一、什么是 UUID？

**UUID（Universally Unique Identifier）** ， 看英文全称就知道，这玩意实际上也就是一个用来唯一标识 某一个东西 的代号。

因此UUID不一定单指代服务器、某一个硬件或者啥的，实际上什么东西只要想，我们都可以给它整一个UUID

或者说的更加具体一点:

> UUID 是 Linux 为“需要被稳定识别的对象”分配的唯一标识

对象可以是：
- 文件系统
- 系统实例
- 网络连接配置(网卡里面的uuid)
- 虚拟资源

---

## 二、Linux 中常见的 3 类 UUID

---

### 文件系统 UUID（最常用）

#### 标识对象
- **文件系统本身**
- 不是磁盘
- 不是接口

#### 为什么需要？
- `/dev/sda`、`/dev/sdb` 等设备名 **不稳定**
- 根据不同的插拔顺序、硬件变化、虚拟化都会导致硬盘名称或者位置发生变化

既然设备名不能稳定标识机器，此时使用 UUID 进行挂载，确保稳定性。

#### 查看方式
```bash
blkid
lsblk -f
````

### 系统 UUID（machine-id）

#### 标识对象

* **系统实例本身**
* 不是硬件 ID
* 不是主机名

#### 存储位置

```bash
/etc/machine-id
```

#### 查看方式

```bash
cat /etc/machine-id
hostnamectl
```

#### 使用场景

* systemd
* 日志系统
* 授权校验
* 集群节点识别

⚠️ 注意：
* 重装系统会生成新的 machine-id
* 运维的时候，新的系统如果是直接克隆拉起的话，则必须修改这个UUID，否则之后的运维工作中这玩意冲突了，很难找到原因的

---

###  网卡 UUID（NetworkManager）

#### 标识对象

* **网络连接配置**
* 不是网卡硬件

#### 重要区分

* 网卡硬件 → MAC 地址
* 网卡 UUID → 一份“连接配置”

同一块网卡可以有多份配置：

* DHCP
* 静态 IP
* VLAN
* 不同路由策略

#### 查看方式

```bash
nmcli connection show
```

#### 配置文件位置

```bash
/etc/NetworkManager/system-connections/
```

⚠️ 一般不推荐手动修改 UUID

---


## 速查表

| 需求   | UUID 类型    | 命令                    |
| ---- | ---------- | --------------------- |
| 挂载磁盘 | 文件系统 UUID  | blkid                 |
| 查看分区 | 文件系统 UUID  | lsblk -f              |
| 系统身份 | machine-id | cat /etc/machine-id   |
| 网络配置 | NM UUID    | nmcli connection show |

---

