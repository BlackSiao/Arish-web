---
title: 系统资源监控
createTime: 2025/12/16 17:24:47
permalink: /notes/实操/qe39ud2i/
---

# Linux 系统资源监控常用命令总结

## 1. free -h(human) —— 查看当前内存使用情况

该命令基本都是查看当前的内存情况，能很直观的看到现在是否存在OOM的情况，但无法定位出原因。

```bash
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           820Mi       183Mi        82Mi       0.0Ki       555Mi       502Mi
Swap:            0B          0B          0B
```

### 关键字段解释

| 字段          | 含义说明                                                                 |
|---------------|--------------------------------------------------------------------------|
| **available** | 最重要！表示系统当前**真正还能分配给新进程的内存** = 空闲内存 + 可回收的 cache/buffer |
| **used**      | 已分配出去的内存(包含正在使用的 + 已经被缓存占用的)                     |
| **buff/cache**| Linux 主动用来缓存文件/块设备的内存，高是正常现象（“空闲内存就是浪费”）   |
| **free**      | 完全没被碰过的内存，日常可以忽略，值很小很正常                            |
| **Swap**      | 硬盘划出来当“临时内存”用。当物理内存彻底不够且无法立刻回收时，才会使用     |

> **核心结论**：看内存够不够，只看 `available`，不要看 `free`！

【补充说明】Swap 被使用不一定是坏事，有时候跑大业务的时候内存被打满是很正常的，但如果 `si/so`（后面 vmstat 会讲）长期非 0，说明内存压力已经很大，需要扩容或优化。

## 2. vmstat —— 快速判断系统哪类资源是瓶颈
vmstat更多的是从CPU的角度出发，看看现在等待使用CPU的进程有多少，CPU是否空闲，CPU等待I/O的时间长不长
```bash
# 每秒刷新一次
vmstat 1
```

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 4  0      0  84984   1004 568064    0    0     1     6   29   28  1  2 97  0  0
```

### 重要字段快速判断法则

| 字段 | 含义                                 | 经验阈值判断                                         |
|------|--------------------------------------|------------------------------------------------------|
| r    | 就绪队列（等待 CPU 的进程数）        | r ≈ CPU 核数：正常<br>r > CPU 核数 × 2：CPU 瓶颈       |
| b    | 被阻塞的进程（通常在等 I/O）         | b 持续大于 0：可能有 I/O 瓶颈                        |
| si/so| Swap In / Swap Out                   | 持续非 0：内存严重不足，已经开始换出到硬盘           |
| bi/bo| 块设备读/写（KB/s）                  | 持续很高 + wa 很高：磁盘 I/O 瓶颈                    |
| us   | 用户态 CPU                           |                                                      |
| sy   | 内核态 CPU                           |                                                      |
| id   | 空闲 CPU                             |                                                      |
| wa(wait i/o)   | CPU空闲，等待I/O的时间        | wa高[>30%]，就说明CPU在等待IO，罪魁祸首是磁盘读的太慢了                     |

## 3. dmesg —— 内核环形缓冲区日志（底层第一现场）

全称：**display message** 或 **driver message**，读作 “dee-message”

- 记录的是内核态的错误、警告、信息
- 典型场景：
  - OOM killer 杀了进程
  - 硬盘 I/O 错误（smart、坏道）
  - 网卡掉线、驱动异常
  - 内核参数调优失败等

```bash
dmesg | tail -50          # 看最新的 50 条
dmesg -w                  # 实时跟随（类似 tail -f）
dmesg --level=err,warn    # 只看错误和警告
dmesg -T | egrep -i 'oom|kill|out of memory|blocked' # 通过内核的日志，给出IO过高的铁证
```

## 4. journalctl —— systemd 系统与服务日志

与 systemd 深度绑定，所有 `systemctl` 管理的服务日志都在这里。

```bash
journalctl -xe            # -x 加人性化解释，-e 直接跳到最后
journalctl -f             # 实时跟随（等价于 tail -f）
journalctl -u sshd        # 查看某个服务日志
journalctl --since "10 min ago"
```

### 日志分类小结（别用错）

| 场景               | 看哪里                         |
|--------------------|--------------------------------|
| 应用自己打印的日志 | 看应用自己的日志文件（如 /var/log/nginx/access.log） |
| systemd 服务日志   | journalctl -u 服务名           |
| 内核级异常         | dmesg 或 journalctl -k         |
| 所有系统+服务日志  | journalctl                     |

## 5. iostat -x —— 详细查看磁盘 I/O 性能（判断 I/O 瓶颈神器）

```bash
iostat -xz 1              # 推荐参数组合，带扩展统计，每秒刷新
```

关键指标：

| 指标     | 含义                               | 经验阈值（严重瓶颈）            |
|----------|------------------------------------|---------------------------------|
| %util    | 磁盘忙碌百分比                     | > 80% 基本就很危险了            |
| await    | 平均 I/O 等待时间（ms）            | > 20-50ms 已经很慢              |
| svctm    | 平均服务时间（越小越好，已弃用）   |                                 |
| r/s + w/s| 每秒读写 IOPS                      |                                 |
| rkB/s + wkB/s | 每秒读写吞吐量                 |                                 |

**I/O 瓶颈典型表现**：
- `wa`（vmstat）很高
- `%util` 接近 100%
- `await` 很高
- 大量进程在 `D` 状态（uninterruptible sleep，通常是等磁盘）

### 经典 I/O 流程图（为什么 CPU 会“发呆”）

```
进程发起读请求
      ↓
内核向磁盘发 I/O 请求
      ↓
磁盘硬件慢慢读取（机械硬盘几十~几百毫秒，SSD 几十微秒）
      ↓
整个进程进入 D 状态（不可中断睡眠），CPU 啥也干不了，只能等
```

## 6.sar 命令学习笔记

`sar`（System Activity Reporter）是 Linux 系统中用于**收集和查看系统性能数据**的工具，属于 `sysstat` 工具包。可以查看 CPU、内存、磁盘、网络等资源的使用情况，并支持历史数据分析。

---

### 1. 常用功能
- 查看 CPU 使用率
- 查看内存使用情况
- 查看磁盘 I/O
- 查看网络流量
- 查看系统负载、上下文切换、进程创建等
- 查看历史性能数据（依赖 sysstat 服务）
---

### 2. 常用命令示例

### 查看 CPU 使用情况
```bash
sar -u
sar -u 1 5  # 每 1 秒采样一次，共 5 次
sar -r      # 查看内存使用情况
sar -d      # 查看磁盘 I/O
sar -n DEV  # 查看网络流量
sar -u -f /var/log/sa/sa15  # 查看 15 号的 CPU 使用情况
```

### sar 命令 CPU 字段全称与含义解释

| 字段       | 全称/含义                  | 解释                                                                 |
|------------|----------------------------|----------------------------------------------------------------------|
| **%user**  | **User time**             | CPU 用于运行**用户态进程**（普通应用、程序）的百分比。通常是主要消耗。 |
| **%nice**  | **Nice time**             | CPU 用于运行**低优先级（niced）用户态进程**的百分比（nice 值 >0 的进程，优先级降低，让出 CPU 给其他任务）。常见于后台批量任务。 |
| **%system**| **System/Kernel time**    | CPU 用于运行**内核态任务**（系统调用、驱动、中断等）的百分比。         |
| **%iowait**| **I/O wait**              | CPU **等待 IO 操作完成**的百分比（类似 vmstat 的 wa）。高时表示 IO 瓶颈（磁盘/网络慢，导致 CPU 空闲但等 IO）。 |
| **%steal** | **Steal time**            | 在**虚拟化环境**（VM、云服务器）中，虚拟 CPU 被 hypervisor（虚拟机管理器）“偷走”去服务其他虚拟机或宿主机的百分比。物理机上为 0；云服务器（如阿里云、AWS）上如果高，说明宿主机超售或负载重。 |
| **%idle**  | **Idle time**             | CPU **完全空闲**（无任务、无 IO 等待）的百分比。高表示系统很闲。       |

## 快速故障定位口诀（背下来超实用）

1. 服务器卡了 → 先 `vmstat 1` 看 r / wa / si/so
   - r 高 → CPU 瓶颈
   - wa 高 → 磁盘 I/O 瓶颈
   - si/so 非 0 → 内存不够
2. 有进程被杀 → `dmesg | grep -i kill` 或 `journalctl -k | grep -i kill`
3. 服务挂了 → `journalctl -u 服务名`
4. 磁盘慢 → `iostat -xz 1`

