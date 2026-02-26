---
title: 13_硬盘和LVM和Volume
createTime: 2026/02/26 22:10:04
permalink: /notes/Linux/0eat9yfo/
---
# Linux 硬盘完整指南

> 这是关于 Linux 硬盘、逻辑卷(LVM)、卷组(VG)、Docker Volume 和挂载点的完整说明

## 第一部分：概念差异 - Linux vs Windows

### Linux 和 Windows 的硬盘本质差异

| 特性 | Windows | Linux |
|------|---------|-------|
| 盘符 | C:、D:、E: 等多个根 | 只有一个根：/ |
| 硬盘使用 | 插进去格式化直接用 | 需要 LVM 初始化后才能用 |
| 灵活性 | 固定分配 | 高度灵活（可在线扩容） |
| 多盘合并 | 困难，需第三方工具 | 原生支持（VG 池化） |

**关键区别**：Linux 追求"一棵统一的目录树"，所有设备都要挂载到这棵树上。

---

## 第二部分：LVM 三大核心概念

### LVM 是什么？

**LVM（Logical Volume Manager）** 是 Linux 的逻辑卷管理系统，让硬盘管理变得灵活高效。

它通过三层抽象，把 PV → VG → LV 组织起来：

### 三层架构详解

| 名称 | 英文全称 | 对标现实 | 作用 | 命令查看 |
|------|---------|---------|------|---------|
| **PV** | Physical Volume 物理卷 | 一块块真实硬盘/分区 | Linux 能"看到"的最原始资源 | `pvs`、`pvdisplay` |
| **VG** | Volume Group 卷组 | 把多块硬盘汇到大水池 | 融合多个 PV 的空间，形成统一资源池 | `vgs`、`vgdisplay` |
| **LV** | Logical Volume 逻辑卷 | 从水池里分配一块区域 | 真正的"虚拟分区"，可以格式化、挂载、使用 | `lvs`、`lvdisplay` |

### 形象理解

```
多块硬盘（PV）
   ↓ (pvcreate)
   ↓
一个水池（VG）
   ↓ (lvcreate)
   ↓
虚拟分区（LV）← 系统能直接用
```

### 一句话总结：
**PV（原料）→ 扔进 VG（大水池）→ 从 VG 里切出一块做成 LV（给系统用）**

---

## 第三部分：常见路径写法（必须背下来）

### LV 的两种标准路径格式

```bash
/dev/VolGroup/root          ← 字符映射方式
/dev/mapper/VolGroup-root   ← 设备映射方式
```

这两个实际上是**符号链接**，都指向同一个逻辑卷。

### 不同系统的默认命名

| 操作系统 | 卷组名（VG） | 根逻辑卷（LV）路径 | 设备路径 | 文件系统 |
|---------|-----------|------------------|---------|---------|
| CentOS 7 | VolGroup | /dev/VolGroup/root | /dev/mapper/VolGroup-root | xfs |
| CentOS 8/9、Rocky | centos | /dev/centos/root | /dev/mapper/centos-root | xfs |
| RHEL 8/9 | rl | /dev/rl/root | /dev/mapper/rl-root | xfs |
| Ubuntu | ubuntu-vg | /dev/ubuntu-vg/ubuntu-lv | /dev/mapper/ubuntu--vg-ubuntu--lv | ext4 |

### 快速查看命令

```bash
vgs              # 看所有卷组
lvs              # 看所有逻辑卷
pvs              # 看所有物理卷
```

---

## 第四部分：硬盘初始化流程

### 新硬盘插入后发生了什么？

一块真实硬盘插入 Linux 系统时：

```bash
lsblk              # 会看到新盘，比如 /dev/sdb
```

但此时这块盘**还不能用**，因为：
- ❌ 没有被识别为物理卷（PV）
- ❌ 没有加入任何卷组（VG）
- ❌ 没有文件系统，系统不知道怎么读取

### 初始化的完整步骤

```bash
# 1. 确认新硬盘被识别
lsblk

# 2. 给硬盘分区（写入分区表）
fdisk /dev/sdb
# 或快速完成：
echo -e "n\np\n1\n\n\nt\n8e\nw" | fdisk /dev/sdb

# 3. 创建物理卷（PV）- 这是 LVM 的第一步
pvcreate /dev/sdb1

# 4. 加入或创建卷组（VG）
vgextend VolGroup /dev/sdb1   # 加入现有 VG
# 或
vgcreate vg_data /dev/sdb1    # 创建新 VG

# 5. 从 VG 中创建逻辑卷（LV）
lvcreate -L 500G -n lv_data vg_data

# 6. 创建文件系统
mkfs.xfs /dev/vg_data/lv_data
# 或
mkfs.ext4 /dev/vg_data/lv_data

# 7. 挂载到目录树
mount /dev/vg_data/lv_data /data

# 8. (可选) 永久挂载，编辑 /etc/fstab
echo "/dev/vg_data/lv_data /data xfs defaults 0 0" >> /etc/fstab
```

初始化后，这块盘的**全部扇区**就进入了 VG（水池），可以被灵活分配。

---

## 第五部分：在线扩容实战（生产最常用）

### 场景
根分区满了，新插了一块硬盘（/dev/sdb），想把这块新盘空间加到根分区。

### 完整操作清单

```bash
# 第一步：确认新硬盘
lsblk
# 看到 /dev/sdb 500G disk

# 第二步：分区
echo -e "n\np\n1\n\n\nt\n8e\nw" | fdisk /dev/sdb

# 第三步：创建物理卷
pvcreate /dev/sdb1

# 第四步：查看当前卷组名（重要！）
vgs
# 输出类似：VolGroup、centos、cl 等

# 第五步：把新 PV 加到现有 VG
vgextend VolGroup /dev/sdb1
# 把 VolGroup 改成你自己的卷组名

# 第六步：查看新增的可用空间
vgdisplay VolGroup

# 第七步：扩展逻辑卷（用全部剩余空间）
lvextend -l +100%FREE /dev/VolGroup/root
# 或其他命名方式：
# lvextend -l +100%FREE /dev/centos/root
# lvextend -l +100%FREE /dev/cl/root

# 第八步：扩展文件系统（这才是真正生效的一步）

# 如果是 xfs（现代系统通常是这个）
xfs_growfs /                          # 注意：挂载点是 /，不是设备名！

# 如果是 ext4（老系统）
resize2fs /dev/VolGroup/root

# 第九步：验证成功
df -h /
lsblk
```

### 最常用的一键扩容脚本

```bash
#!/bin/bash
# 适用于根分区用 xfs 文件系统的系统（CentOS 8/9、Rocky 等）

fdisk -l /dev/sdb | grep -q "does not contain a valid partition table" && {
    echo -e "n\np\n1\n\n\nt\n8e\nw" | fdisk /dev/sdb
}

pvcreate /dev/sdb1
VG_NAME=$(vgs --noheadings -o name | head -1)
vgextend $VG_NAME /dev/sdb1
LV_PATH=$(lvs --noheadings -o lv_dm_path | grep root | head -1)
lvextend -l +100%FREE $LV_PATH
xfs_growfs /
```

---

## 第六部分：挂载点的本质

### 什么是挂载？

在 Linux 里：

> **所有存储设备必须"挂载"到某个目录，才能被访问**

### Linux 的唯一目录树

不像 Windows 有多个盘符（C:、D:、E:），Linux **只有一棵目录树**：

```
/
├── etc
├── home
├── data        ← 这个目录可以挂载硬盘
└── var
```

### 挂载的本质（核心理解）

**挂载 ≠ 合并磁盘**

**挂载 = 把某个硬盘"插入"到目录树的某个节点**

#### 例子

假设你有新硬盘 `/dev/sdb1`，执行：

```bash
mount /dev/sdb1 /data
```

发生的是：

1. `/data` 原本是硬盘1上的普通目录
2. 挂载后，`/data` 变成了 `/dev/sdb1` 的**入口**
3. 访问 `/data` 实际上访问的是 `/dev/sdb1`
4. `/data` 里的原始内容被"隐藏"（断开挂载后恢复）

### 关键点：根目录不会变大

❌ **错误理解**：挂载新硬盘后根目录变大了

✅ **正确理解**：

```bash
df -h
# /dev/sda1  100G  /                 ← 根分区仍然是100G
# /dev/sdb1  1T    /data             ← 新硬盘挂在 /data
```

根分区容量**没有变**，只是新硬盘的某个分支挂在了别处。

### 什么时候根目录才会真的变大？

#### 情况1：LVM 在线扩容（逻辑扩大）

```bash
lvextend -L +100G /dev/vg/root    # 把根 LV 扩大100G
xfs_growfs /                       # 文件系统感知新空间
```

#### 情况2：根分区一开始就用多块硬盘做的 VG

```bash
# 初始化时
sda + sdb → 同一个 VG → root LV
```

这样 root LV 本身就跨越多块硬盘，容量是它们的总和。

### 一句话总结

> **挂载只是把目录树的某个节点接到另一块磁盘上，根分区容量不会变，只是子目录换了底层设备。**

---

## 第七部分：Docker Volume 和硬盘的关系

### Docker Volume 是什么？

Docker Volume 本质上很简单：

> **把宿主机的某个目录挂载进容器内，让容器数据不会随着容器销毁而消失**

### 三个关键点

| 特性 | 说明 |
|------|------|
| 挂载对象 | 目录，不是设备 |
| 数据持久化 | 容器删了，数据还在宿主机 |
| 存储路径 | 可以是硬盘、LVM、NFS 等任何地方 |

### Docker Volume 和 LVM 的完整链路

假设场景：

1. 有一块新硬盘 `/dev/sdb`
2. 想让 Docker 容器数据存在这块硬盘上

完整步骤：

```bash
# 第1步：初始化硬盘，创建 LVM 逻辑卷
pvcreate /dev/sdb
vgcreate vg_docker /dev/sdb
lvcreate -L 500G -n lv_docker vg_docker
mkfs.xfs /dev/vg_docker/lv_docker

# 第2步：把逻辑卷挂载到宿主机的某个目录
mkdir -p /data/docker-volumes
mount /dev/vg_docker/lv_docker /data/docker-volumes

# 第3步：让 Docker 使用这个目录
docker run -d \
  -v /data/docker-volumes:/app/data \
  --name my-app \
  nginx

# 第4步（可选）：永久挂载
echo "/dev/vg_docker/lv_docker /data/docker-volumes xfs defaults 0 0" >> /etc/fstab
```

### 关键理解

Docker Volume 链路：

```
硬盘设备 (/dev/sdb)
   ↓ (LVM 初始化)
逻辑卷 (/dev/vg_docker/lv_docker)
   ↓ (格式化)
文件系统 (ext4/xfs)
   ↓ (mount)
宿主机目录 (/data/docker-volumes)
   ↓ (docker -v)
容器内路径 (/app/data)
```

**每一层都很关键**。跳过任何一步都用不了。

### 保持数据和性能的最佳实践

```bash
# 1. 给 Docker 数据目录单独分配 LVM
lvcreate -L 500G -n lv_docker vg_system

# 2. 使用高性能文件系统（通常是 xfs）
mkfs.xfs /dev/vg_system/lv_docker

# 3. 挂载时用合适的选项
mount -o defaults,noatime /dev/vg_system/lv_docker /data/docker

# 4. Docker 指定自定义数据目录（可选）
# /etc/docker/daemon.json
{
  "data-root": "/data/docker"
}

# 5. 重启 Docker
systemctl restart docker
```

---

## 第八部分：验证你的理解

### 自我测试

运行这些命令，理解它们的输出：

```bash
# 看物理层面
lsblk

# 看 LVM 层
pvs && vgs && lvs

# 看挂载情况
mount | grep -E "^/dev"
df -h

# 看 Docker 数据位置
docker info | grep "Docker Root Dir"
```

### 预期输出示例

```bash
# lsblk
NAME            MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
sda               8:0    0 500G  0 disk
├─sda1            8:1    0   1G  0 part /boot
└─sda2            8:2    0 499G  0 part
  ├─centos-root 253:0    0 200G  0 lvm  /
  └─centos-swap 253:1    0   8G  0 lvm  [SWAP]
sdb               8:16   0   1T  0 disk
└─sdb1           8:17   0   1T  0 part
  └─vg_data-lv_docker 253:2 0 1T  0 lvm  /data/docker

# df -h
Filesystem                Size  Used Avail Use% Mounted on
/dev/mapper/centos-root   200G   50G  150G  25% /
/dev/mapper/vg_data-lv_docker 1T  100G  900G  10% /data/docker
```

---

## 总结

### 五个关键认知

1. **Linux 只有一棵树** - 所有设备都要挂到这棵树上
2. **LVM 是三层结构** - PV → VG → LV，越来越逻辑化
3. **挂载不改变容量** - 只是改变某个目录的数据来源
4. **在线扩容的秘密** - LV 扩容 + 文件系统识别 = 无缝扩大
5. **Docker Volume 是顶层应用** - 最底端必须是硬盘 + LVM
