
# 内核日志 (dmesg) vs. 系统日志 (syslog)

- 内核日志 (journactl -k / dmesg)：只记录 Linux 内核层级的消息。比如：硬件驱动加载、内存溢出（OOM）、网卡链路状态切换（UP/DOWN）、防火墙（iptables/nftables）拦截记录等。
- 系统/应用日志：记录的是用户态的消息。比如：SSH 登录、Cron 定时任务执行、Nginx 访问记录、数据库报错等。

顺带一提，内核日志是保存的原文件就在 /dev/kmsg 里面

# 告警: OOM-killer

当Linux内核检测到系统内存不足时，会触发**OOM-killer**（Out of Memory Killer）机制，强制杀死某些进程以防止系统崩溃。这并不总是意味着物理内存耗尽，也可能是容器或进程组的内存限制被触发。

## 查看OOM事件

由于OOM事件由内核触发，首先检查内核环形缓冲区（Kernel Ring Buffer）是最快的方法。使用`dmesg`命令：

```bash
dmesg -T | grep -i "oom"
```

**注意**：`-T`参数将时间戳转换为可读格式。

`dmesg`日志存储在内存中，重启后会丢失。若事件较久或系统重启，应检查系统日志：
- 旧版系统：`/var/log/syslog` 或 `/var/log/messages`
- 新版系统（使用systemd）：使用`journalctl`

```bash
journalctl -k | grep -i "oom"
```

## 日志示例与分析

以下是可能的输出示例：

```
root:# dmesg -T | grep -i "oom"
[Thu Mar 12 21:24:55 2026] probe invoked oom-killer: gfp_mask=0x100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
[Thu Mar 12 21:24:55 2026]  oom_kill_process.cold+0xb/0x10
[Thu Mar 12 21:24:55 2026] [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
[Thu Mar 12 21:24:55 2026] oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null),cpuset=xx,mems_allowed=0-1,oom_memcg=/docker/xx,task_memcg=/docker/xx,task=probe,pid=2557,uid=0
[Thu Mar 12 21:24:55 2026] Memory cgroup out of memory: Killed process 2557 (probe) total-vm:7826068kB, anon-rss:198448kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:1380kB oom_score_adj:0
```

在OOM日志中，重点关注以下内容：

- **invoked oom-killer**：触发OOM的进程（不一定是最终被杀的进程，但它是最后一个申请内存失败的）。
- **Killed process [PID] (name)**：被杀死的进程及其PID。
- **Total RAM / Free RAM**：（如果显示）发生时的系统总内存和剩余内存（注意：示例中未显示，可能因内核版本而异）。
- **oom_score列表**：系统为每个进程计算的OOM分数（oom_score），分数越高越容易被杀死。日志会列出进程的内存使用情况（rss）和分数。

## 约束类型分析

日志中的`constraint`字段指示OOM触发的原因：

- **CONSTRAINT_MEMCG**：触发的是内存控制组（Memory Control Group）限制，表示进程所在的容器或进程组设置了内存上限，请求内存超过此上限。
- **CONSTRAINT_NONE**：表示物理机内存不足。

在示例中，`oom_memcg=/docker/xx`表明这是一个Docker容器的内存限制问题，而非整个系统的物理内存不足。