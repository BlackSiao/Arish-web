---
title: strace和ftrace
createTime: 2025/10/14 11:18:08
permalink: /notes/Linux/kbejdwvs/
---

# strace 和 ftrace

## 工具比较

| 工具     | 关注层级                  | 核心用途                                      |
|----------|---------------------------|-----------------------------------------------|
| strace  | 用户态 ↔ 内核接口（系统调用） | 跟踪程序调用了哪些系统调用、参数与返回值是什么 |
| ftrace  | 内核内部                  | 跟踪内核函数执行、性能、延迟、调度等更底层行为 |

### 形象比喻
- **strace**：像是在门口看人进出  
  ➜ 记录程序“请求系统”的所有系统调用（如 `open`、`read`、`write`、`socket`）。
- **ftrace**：像是进去屋里观察内核内部  
  ➜ 分析具体内核函数执行流程、延迟、CPU 调度、软中断等。

## 常见误区及解决

| 常见误区                  | 原因                          | 正确做法                                      |
|---------------------------|-------------------------------|-----------------------------------------------|
| strace 一开全屏跑，看不懂 | 输出太多系统调用              | 用 `-e trace=open,read,write` 过滤            |
| 忘记 root 权限跑 ftrace   | ftrace 需要较高权限           | 使用 `sudo` 或切 root                         |
| 误以为 ftrace 是命令      | 其实是内核子系统，不是一条命令 | 通过 `/sys/kernel/debug/tracing` 或 `trace-cmd` 使用 |
| 想用 strace 分析内核问题  | strace 只能看用户态调用       | 内核卡死问题请用 ftrace 或 perf               |

## strace 示例

假设现在 `snmpd` 进程无法正常启动，对应的进程号是：100815。

**注意：** 用 `>` 重定向，只会捕获标准输出（stdout），而 strace 默认写到标准错误（stderr）！  
所以要为了防止大量的系统调用冲昏头脑，需要使用 '2>' 来重定向输出到log里面。

```bash
strace -tt -e trace=open,read,write -p 100815 2> trace.log
```

### 选项说明

| 选项             | 作用                                      |
|------------------|-------------------------------------------|
| `-tt`           | 打印时间戳，分析延迟或卡住位置            |
| `-p 100815`     | 附加到目标进程                            |
| `-e trace=...`  | 只跟踪指定系统调用，减少噪音              |
| `2> trace.log`  | 把结果写入日志文件                        |

## 常见故障类型及 strace 特征

| 故障类型              | 在 strace 中会看到的特征系统调用                                                                 |
|-----------------------|--------------------------------------------------------------------------------------------------|
| ❗ 配置文件缺失 / 路径错误 | `open(...) = -1 ENOENT (No such file or directory)`                                              |
| 🔒 权限不足           | `open(...) = -1 EACCES (Permission denied)`                                                      |
| 🧊 程序卡死 / 卡在 IO 或系统调用 | 一直重复 `read(...)` 或卡在 `futex(...)` 没有返回                                                |
| 🛑 端口被占用 / 绑定失败 | `bind(...) = -1 EADDRINUSE`                                                                      |
| 🔗 DNS / 网络问题     | `connect(...)`、`getaddrinfo(...)` 长时间无响应                                                  |
| 💥 崩溃 / 信号异常    | `--- SIGSEGV`、`SIGABRT`、`SIGKILL` 等信号信息                                                   |
| 🧬 库文件缺失 (动态库) | `open("/lib/...", O_RDONLY) = -1 ENOENT`                                                         |
| 🧵 多线程死锁         | 大量 `futex(...)` 或 `nanosleep(...)` 重复                                                       |

### 实际案例解读（片段示例）

1. **配置文件问题** (snmpd 常见故障)  
   ```
   open("/etc/snmp/snmpd.conf", O_RDONLY) = -1 ENOENT (No such file or directory)
   ```  
   🔎 **意味着**：配置文件路径错了，或文件不存在。

2. **权限不足**  
   ```
   open("/var/lib/snmp/snmpd.conf", O_RDONLY) = -1 EACCES (Permission denied)
   ```  
   🔎 **意味着**：程序无法读取关键文件，可能需要 `chown` 或调整 `/var/lib/snmp/*` 权限。

3. **程序卡住** (死循环或等待)  
   ```
   read(4,  <unfinished ...>
   futex(0x7f1234abcd, FUTEX_WAIT, 0, NULL) = 0
   ```  
   🔎 **意味着**：程序在等待某资源/锁，可能内部卡死。

4. **端口冲突** (如 SNMP 使用 UDP 161)  
   ```
   bind(3, {sa_family=AF_INET, sin_port=htons(161)}, ...) = -1 EADDRINUSE (Address already in use)
   ```  
   🔎 **意味着**：端口被占用，无法启动服务。

5. **网络或 DNS 延迟**  
   ```
   connect(5, {AF_INET, ...}, ...)   # 一直阻塞
   getaddrinfo("example.com", ...)   # 无返回
   ```  
   🔎 **意味着**：程序尝试网络访问但无响应卡住。