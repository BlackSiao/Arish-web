---
title: 03_Linux硬盘扩容
createTime: 2025/11/08 11:02:13
permalink: /notes/Linux/speghfnc/
---

### 文件 1：LVM 核心概念
```markdown
# LVM 三大核心概念（Logical Volume Manager）

| 名称      | 英文全称               | 类比现实生活            | 作用和特点                                   |
|-----------|------------------------|-------------------------|----------------------------------------------|
| PV        | Physical Volume 物理卷 | 一块块真实的硬盘/分区   | 必须先 pvcreate 才能被 LVM 识别              |
| VG        | Volume Group 卷组      | 把多块硬盘“拼成一个大池子” | 所有 PV 的空间汇总在一起，形成一个“大水池” |
| LV        | Logical Volume 逻辑卷  | 从水池里划出来的一桶水  | 真正的“分区”，可以格式化、挂载、使用        |

**一句话总结**：  
PV（原料）→ 扔进 VG（大水池）→ 从 VG 里切出一块做成 LV（给系统用）

**最常见的路径写法（要背下来）**
/dev/VolGroup/root      
/dev/mapper/VolGroup-root   ← 这两个其实是一样的（符号链接）
/dev/centos/root
/dev/mapper/cl-root
```

### 文件 2：新增一块硬盘 → 在线扩容根分区 全流程清单（生产必备）

```markdown
# Linux 硬盘扩容

> 场景：服务器根分区已满，于是新插/挂载了一块硬盘（比如 /dev/sdb），想把新硬盘空间加到 /（根分区）

## 大概流程如下
**分一个区 → pv → vgextend → lvextend +100%FREE → xfs_growfs /（或 resize2fs）**

## 完整操作步骤（直接复制粘贴）

```bash
# 1. 确认新硬盘被识别（整盘给 LVM 用最简单）
lsblk
# 看到 /dev/sdb  500G  disk

# 2. 给新硬盘快速分一个主分区（类型 Linux LVM）
echo -e "n\np\n1\n\n\nt\n8e\nw" | fdisk /dev/sdb

# 3. 创建物理卷 PV
pvcreate /dev/sdb1

# 4. 把新 PV 加入现有卷组（先确认卷组名！）
vgs                     # 常见：VolGroup、centos、cl、rootvg
vgextend VolGroup /dev/sdb1          # ← 把卷组名改成你自己的

# 5. 把卷组里全部剩余空间加到根逻辑卷
lvextend -l +100%FREE /dev/mapper/centos-root     # CentOS 8/9
# 或
lvextend -l +100%FREE /dev/VolGroup/root          # CentOS 7
# 或
lvextend -l +100%FREE /dev/cl/root                # 某些系统

# 6. 在线扩大文件系统（根据实际文件系统执行一个即可！）
# 99% 的现代系统都是 xfs
xfs_growfs /                     # 注意：写挂载点 / ，不是设备名！

# 如果是老系统的 ext4
resize2fs /dev/mapper/centos-root
# 或
resize2fs /dev/VolGroup/root

# 7. 验证成功
df -h /
lsblk
free -h
```

## 不同系统默认名称速查表（一眼记住）

| 系统               | 卷组名（VG） | 根逻辑卷路径（LV）                  | 文件系统 | 最后扩文件系统命令         |
|--------------------|--------------|-------------------------------------|----------|----------------------------|
| CentOS 7           | VolGroup     | /dev/VolGroup/root                  | xfs      | xfs_growfs /               |
| CentOS 8/9、Rocky、AlmaLinux | centos     | /dev/centos/root                    | xfs      | xfs_growfs /               |
| RHEL 8/9           | rl           | /dev/rl/root                        | xfs      | xfs_growfs /               |
| Ubuntu             | ubuntu-vg    | /dev/ubuntu-vg/ubuntu-lv            | ext4     | resize2fs 设备路径         |
