---
title: Linux & 网络常用 CheatList
description: 本文件收集常用的 Linux 与网络排查命令与使用要点，方便运维快速定位问题并记录结果。
createTime: 2026/02/24 18:19:20
permalink: /notes/Internet/u719fp1c/
---

# Linux & 网络 常用 CheatList

本文件收集常用的 Linux 与网络排查命令与使用要点，方便运维快速定位问题并记录结果。

---

## 网络流量与带宽

- 实时查看网卡流量（sar）

```bash
sar -n DEV 1 10
# 输出中常见字段：rxkB/s（接收 KB/s），txkB/s（发送 KB/s）
```

说明：`sar` 可以展示历史与实时网卡统计，单位通常为 KB/s，观察趋势比瞬时更重要。

---

## 文件系统与时间信息

- 查看文件系统（根目录）创建时间（部分系统支持 Birth 字段）

```bash
stat / | grep Birth
```

说明：在某些 Linux 文件系统上，根目录的 Birth（创建时间）等同于系统安装时间；并非所有 FS 都支持该字段。

---

## MTR（My Traceroute）—— 路径与丢包诊断

### 简介
MTR 结合了 `ping` 与 `traceroute` 的功能，会持续发送探测包并实时更新每一跳的丢包与延迟，适合定位网络抖动与丢包点。

### 安装

```bash
# Debian / Ubuntu
sudo apt update && sudo apt install mtr -y

# CentOS / RHEL / Fedora
sudo yum install mtr -y
```

### 常用用法

```bash
# 交互模式（实时，按 q 退出）
mtr 8.8.8.8

# 报告模式（适合保存/分析）
mtr -rw 8.8.8.8

# 指定探测次数（例如 20 次）
mtr -c 20 8.8.8.8
```

### 输出字段说明（常见）
- Host：路由节点 IP/域名
- Loss%：丢包率（关键指标）
- Snt：发送包总数
- Last / Avg / Best / Wrst：延迟统计（ms）
- StDev：延迟标准差（抖动）

### 排查要点
- 如果中间跳出现丢包但终点无丢包，通常是中间设备对 ICMP 限速（可忽略）；若终点也丢包，则为真实链路问题。
- 若第 N 跳开始持续丢包至终点，问题通常出在该跳所在运营商/机房。
- CDN 与回源场景：用 `mtr -rw <源站IP>` 检查源站链路。

### 交互模式快捷键
- h：帮助
- p：暂停/恢复
- d：切换显示模式
- c：清除统计并重新开始

---

## 快速排查命令速查

- 查看当前 TCP 连接数：

```bash
ss -ant | wc -l
netstat -an | grep ESTABLISHED
```

- 查看进程与资源：

```bash
top -c
htop        # 如果已安装
vmstat 1
```

- 查看网卡速率与状态：

```bash
ethtool eth0
```

---

更新时间：2026-02-24
