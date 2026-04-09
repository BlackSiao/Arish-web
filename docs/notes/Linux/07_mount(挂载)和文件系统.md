---
title: 07_mount(挂载)和文件系统
createTime: 2026/02/10 15:42:25
permalink: /notes/Linux/23wfqm2y/
---

## 挂载（mount）到底是什么意思？

简单来说，**挂载（mount）** 就是把一个“设备”或“文件”里的内容，**映射**到 Linux 文件系统目录树中的某个目录下，让它看起来像是本来就“长”在这个目录里一样。

把 Linux 的文件系统想象成一棵以 `/` 为根的大树：

- 目前这棵树上只有一些“原生”的目录和文件（`/bin`、`/etc`、`/home`、`/var` 等）。
- 但你的电脑或服务器上还有很多其他“东西”：硬盘分区、U盘、移动硬盘、光盘（ISO镜像）、网盘、虚拟磁盘、其他分区，甚至 Windows 的 NTFS 分区……

**mount 的作用**：把这些“外来”的东西接驳到这棵大树上的某个空目录里，让它们成为树的一部分，可被访问。

---

## 文件系统是什么？

`/dev/sda` 不是文件夹，而是一个“块设备”。它包含的是连续字节流，不是操作系统可直接识别的文件和目录结构。

文件系统负责在磁盘上组织数据：

- 哪些区域存文件，哪些区域是空闲
- 文件名、权限、时间戳等元数据信息
- 让操作系统能高效读写文件

> 没有格式化的磁盘无法直接挂载，必须先分区（`fdisk`/`parted`）和格式化（`mkfs.ext4`/`mkfs.xfs`）

### 常见文件系统对比

- `ext4`：Linux 默认，稳定成熟，适用于系统盘、数据盘
- `xfs`：大文件性能优，常见于CentOS/RHEL和大容量存储
- `tmpfs`：基于内存，重启丢失，常用于`/tmp`、`/run`
- `devtmpfs`：内核虚拟设备文件系统，挂载在`/dev`
- `proc` / `sysfs`：内核信息虚拟文件系统，挂载在`/proc`、`/sys`

### 直观查看

```bash
df -h
```

示例输出：

```
文件系统        容量   已用  可用  使用%  挂载点
/dev/sda1       50G    45G   5G   90%   /
/dev/sdb1      500G   200G  300G  40%   /data
tmpfs            8G    16M   8G    1%   /tmp
```

---

## 分区与块设备

多数场景下不会直接操作整块磁盘（如`/dev/sda`），而是操作**分区**（如`/dev/sda1`）。

分区本身还是一段连续的字节区间，需要文件系统才能转换成目录树。

### 不能做的事情

```bash
cd /dev/sda                # 错误：/dev/sda 不是目录
ls /dev/sda                # 错误：/dev/sda 不是目录
cat /dev/sda/file.txt      # 错误：/dev/sda 没有文件结构
```

---

## 为什么 Linux 设计成这种挂载方式？

- 内核把设备和文件系统分开，提供更高灵活性
- 管理员决定“挂在哪里、怎么挂”
- 支持多种挂载方式（bind mount、overlay、网络文件系统）

优势：

- 可把不同分区挂载到任意位置
- 支持将一个目录绑定到另一个位置（`mount --bind`）
- 支持 ISO loop 挂载、LVM、加密卷、网络挂载（NFS/SMB）等

---

## 新插硬盘的挂载流程

1. 确认设备名（例如：`/dev/sdb`）
   - `lsblk`、`fdisk -l`、`parted -l`
2. 分区（如：`/dev/sdb1`）
   - `fdisk /dev/sdb` 或 `parted /dev/sdb`
3. 格式化文件系统
   - `mkfs.ext4 /dev/sdb1`（或`mkfs.xfs`等）
4. 创建挂载点
   - `mkdir -p /mnt/data`
5. 挂载
   - `mount /dev/sdb1 /mnt/data`
6. 设置开机自动挂载
   - 在`/etc/fstab`中加入：

```
/dev/sdb1 /mnt/data ext4 defaults 0 2
```

---

## 进阶命令

- 查看当前挂载：`mount | column -t`
- 查看指定类型挂载（如XFS）：`mount -t xfs`
- 卸载：`umount /mnt/data`
- 查看块设备信息：`lsblk -f`
- 查看所有文件系统支持：`cat /proc/filesystems`
