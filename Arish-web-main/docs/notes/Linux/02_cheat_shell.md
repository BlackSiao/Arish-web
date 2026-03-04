---
title: 02_cheat_shell
createTime: 2025/09/23 15:47:50
permalink: /notes/Linux/1ss1lgue/
---
# DDI 常用日志查看

## 1. DDI 常看的日志

### 1.1 存放 DNS 以前的查询日志路径为：
```
/usr/local/appdata/normal/log/log_bak/query
```

面对 `.gz` 文件一般都是使用：

```bash
zcat xx.gz | grep "域名/IP/时间"
zcat xx.gz | head     # 查看前三条数据
zcat xx.gz | tail     # 查看后三条数据
zcat *.gz | grep "域名/IP/时间" > output.log     # 从所有的 gz 文件里面搜出符合的记录，存在事先创建好的 output.log 里面
awk '$1 == "14-Jul-2025" && $2 >= "14:38:00" { print }' query.log | less  # 对 query.log 日志进行额外处理
```

### 1.2 后台查看 DNS 对应区记录信息
```bash
cat /usr/local/appdata/normal/data/zddi/default                 # DNS 视图配置
```

### 1.3 查看对应 DHCP 租约的
```bash
cat /usr/local/appdata/normal/data/zddi/dhcp/db/dhcpd.leases     # DHCP 租约
```

### 1.4 查看所有系统服务
```bash
/usr/local/appsys/normal/package/zdns_startmgr/startmgr-ctl -i getServers      # 查看服务
```

## 2. tcpdump 抓包

### 基础语法
```bash
sudo tcpdump -i <接口> [条件]
```

### 常用选项
- `-i <接口>`     # 指定网卡接口，如 ens192 / any
- `-nnv`           # 显示数字 IP 和端口，不解析主机名和服务名
- `-c <数量>`      # 抓取指定数量的包后退出
- `-w <文件>`      # 将抓包数据保存为文件（可用 Wireshark 打开）
- `-r <文件>`      # 读取已保存的抓包文件

### 常用过滤条件
- `tcp / udp / icmp / arp`  # 按协议
- `port 53`                 # 按端口
- `host 192.168.1.1`        # 指定主机
- `src 10.0.0.1`            # 来源 IP
- `dst 8.8.8.8`             # 目标 IP

### 示例
```bash
sudo tcpdump -i any -nnv udp port 53 and host 172.16.20.17   # 查 172.16.20.17 这个 IP 发到 53 端口的
sudo tcpdump -i any -nnv udp port 53 and "( host 172.16.20.17 or host 172.16.10.194 )"
tcpdump -i any -s 0 -n -vvv port 53 | grep "mm.bitbrowser.me"  # 过滤对应域名的
```

## 3. dnsperf 压力测试

### 基础语法
```bash
dnsperf [选项] -d 查询文件
```

- `-s <DNS服务器>`   # 默认 127.0.0.1
- `-p <端口>`        # 默认 53
- `-d <查询文件>`    # DNS 查询列表文件
- `-Q <QPS>`         # 限制最大查询速率
- `-c <并发数>`      # 并发客户端数量
- `-t <超时时间>`    # 默认 5s
- `-l <时长>`        # 限制测试时长
- `-T <协议>`        # udp/tcp/dot/doh
- `-v`               # 显示详细日志

### 查询文件格式
```
example.com A
test.com AAAA
```

## 4. dig 循环查询 & 实时观察

有时候可以想通过反复 dig 来查看切 HA 或者操作是否对业务有影响

### 每秒观察一次解析
```bash
watch -n 1 "dig @172.16.10.191 www.example.com +short"
```

### 更加高级的自定义循环观察
```bash
while true; do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  result=$(dig @172.16.10.195 www.example.com +stats 2>&1)
  query_time=$(echo "$result" | grep "Query time:" | awk '{print $4}')
  server_ip=$(echo "$result" | grep "SERVER:" | awk '{print $3}' | cut -d'#' -f1)
  answer=$(echo "$result" | grep -A 1 "ANSWER SECTION:" | tail -n 1 | awk '{print $5}')
  echo "$timestamp: $answer from $server_ip: query_time=${query_time}ms"
  sleep 1
done
```

## 5. 系统命令 & 常用工具
- `top -c`                              # 查看系统资源占用（M=内存，P=CPU排序）
- `rz / sz`                          # 文件传输 (Xshell / SecureCRT)
- `ssh user@host`                # 登录远程主机
- `su username / root`          # 切换用户
- `tar -zxvf /insight/packages/xxx.tar.gz -C /insight/versions/`  # 解压某个 gz 文件到 /insight/versions 下
- `dmidecode -t 1`                  # 查看系统的硬件信息
- `uname -r`                          # 查看内核版本、OS 发行版、CPU 架构
- `find /usr/bin -type f | xargs grep -l "hello word"`    # 使用 find 命令来内部含有 hello world 字段的全部文件
- `scp -r root@IP地址:/对端文件地址/ /本机地址`
- `df -lh` # 查看 文件系统的磁盘空间使用情况
- `du -sh /文件系统目录/` # 查看对应目录下哪些文件占用空间最多
- `mkdir -p /insight/packages /insight/versions` # 递归创建多个文件夹
- `netstat -tuln`    # 查看全部被监听的端口
- `ss -tuln`         # netstat的上位替代
- `free -h`          # 查看内存的利用情况

## 6. 网络命令
- `lurker -c conf -l /etc/license.file` # 查看 license 的全部信息
- `arp -a`       # 查看 ARP 缓存
- `curl cip.cc`   # 查看公网 IP
- `ipconfig /all`    # Windows 查看 IP
- `ipconfig /release` # 释放租约
- `ipconfig /renew`   # 更新租约
- `ls -lh`             # 查看对应文件内所有文件大小
- `curl ifconfig.me`   # 查看本机的公网地址
- `telent IP地址 端口`  # 连接对应终端的特定端口

### 6.2 Wireshark 技巧

过滤 DHCP Request 包：

DHCP 报文的 Option
- 53 (DHCP Message Type) 指定了消息类型。
- DHCP Discover → 值为 1
- DHCP Offer → 值为 2
- DHCP Request → 值为 3
- DHCP Decline → 值为 4
- DHCP ACK → 值为 5
- DHCP NAK → 值为 6
- DHCP Release → 值为 7
- DHCP Inform → 值为 8

所以要过滤 DHCP Request：`bootp.option.dhcp == 3`

## 7. 处理硬件故障

### 7.1 查看硬件配置
```bash
dmidecode -t 1   # 查看硬件型号等信息
```

### 7.2 电源模块
```bash
aps -p fwa-3270 -s YM-2301E
cat /usr/local/appdata/normal/confi/busylibs/description.json
cat /usr/local/appdata/normal/config/busylibs/hardware.yml
```

### 7.3 查看硬盘

#### RAID & 硬盘
```bash
lspci | grep -i raid
lsblk
mdadm -D /dev/md127
```

### 7.4 数据库相关（PostgreSQL）
```bash
psql -U postgres -d ipam -p 5450/5435
select * from dhcpconfig ;
\d t_network
select ipam_total,ipam_used from t_network where network='172.16.100.0/24';
update t_network set ipam_used='300' where network='172.16.100.0/24';
```

## 常用网站

- https://tool.ip138.com/punycode/: Punycode是一个根据RFC 3492标准而制定的编码系统,主要用於把域名从地方语言所采用的Unicode编码转换成为可用於DNS系统的编码。Punycode可以防止IDN欺骗。
- ip138.com: 查IP地址的
- mdig.cc:   网页模拟dig

# vi编辑器的使用
```
1. "/xx"用来从文本中定位到匹配的字段, "n"可以选择下一个匹配项, "N"可以选择上一个匹配项
2. ":x"用来从文本中定位到对应的行号
3. 按V进入交互模式后，选中的内容, 可以用'y'复制下来
```

# 定位文件
### Linux 文件查找命令详解

您提供的描述已经很准确地概括了 `which`、`whereis`、`locate` 和 `find` 这四个常用文件查找命令的核心特点。下面我将逐一详细解释每个命令，包括其原理、使用场景、语法、选项示例、优缺点，以及实际使用建议。这些命令都是 Linux/Unix 系统中的标准工具，主要用于定位文件或命令的位置，帮助管理员和开发者快速管理文件系统。它们在查找范围、速度和功能上各有侧重，选择时需根据需求权衡。

#### 1. `which` 命令
**核心功能**：`which` 主要用于查找**可执行命令**的位置。它只在环境变量 `$PATH` 指定的目录中搜索可执行文件（二进制文件或脚本），不搜索其他地方。这使得它非常适合验证命令是否存在和其确切路径。

**原理**：它模拟 shell 的命令解析过程，遍历 `$PATH` 中的每个目录，检查第一个匹配的执行文件。默认只返回第一个匹配结果，速度极快，因为搜索范围最小（通常只有 `/usr/bin`、`/bin` 等系统路径）。

**语法**：
```
which [选项] 命令名
```

**常用选项**：
- `-a`：显示所有匹配的路径（不止第一个）。
- `-i`：忽略别名，直接搜索路径。

**示例**：
- 查找 `ls` 命令的位置：`which ls`  
  输出：`/usr/bin/ls`（假设这是第一个匹配）。
- 查找所有 `python` 路径：`which -a python`  
  输出可能：`/usr/bin/python` 和 `/usr/local/bin/python`。

**优缺点**：
- **优点**：速度快、简单、只针对命令，适合脚本自动化验证。
- **缺点**：范围小，不能找非可执行文件；不处理符号链接（默认显示实际路径）。
- **使用场景**：在 shell 脚本中检查工具是否安装，或快速定位命令。

**注意**：如果命令是内置 shell 命令（如 `cd`），`which` 可能返回空结果，因为内置命令不在 `$PATH` 中。

#### 2. `whereis` 命令
**核心功能**：`whereis` 比 `which` 更全面，不仅限于可执行命令，还能查找源代码文件、手册页（man pages）和相关文件。它在 `$PATH` 基础上扩展到一些固定系统目录（如 `/usr/share`、`/etc`），搜索范围稍大，但仍很高效。

**原理**：它直接查询系统预设的目录列表（包括二进制、man 和源代码路径），不遍历整个文件系统。man 手册声称只支持命令、源文件和 man 文件，但实际测试（如查找 `/etc/passwd`）显示它能处理大多数系统文件，因为它本质上检查特定路径下的模式匹配。

**语法**：
```
whereis [选项] 文件名
```

**常用选项**：
- `-b`：只搜索二进制文件（相当于简化版 `which`）。
- `-m`：只搜索 man 手册页。
- `-s`：只搜索源代码文件。
- `-u`：显示未找到的条目（用于调试）。

**示例**：
- 查找 `gcc` 的所有相关文件：`whereis gcc`  
  输出：`gcc: /usr/bin/gcc /usr/share/man/man1/gcc.1.gz`（二进制 + man 页）。
- 只找二进制：`whereis -b ls`  
  输出：`ls: /bin/ls /usr/bin/ls`。

**优缺点**：
- **优点**：速度快、多类型支持、输出简洁（一行显示所有）。
- **缺点**：范围仍有限（不搜整个系统），对自定义安装的文件可能漏掉；不递归子目录。
- **使用场景**：快速定位命令的文档或源文件，尤其在开发环境中（如找 `vim` 的 man 页）。

**注意**：`whereis` 的搜索目录是硬编码的，可通过查看源代码或 `strings /usr/bin/whereis` 确认具体路径。

#### 3. `locate` 命令
**核心功能**：`locate` 是超高速的文件查找工具，能搜索整个文件系统的任意文件（包括普通文件、目录）。它依赖 Linux 的内置索引数据库（通常由 `mlocate` 或 `updatedb` 维护），而非实时扫描磁盘。

**原理**：数据库定期更新文件路径索引（默认每天 cron 任务运行）。搜索时直接查询数据库，返回所有匹配路径。速度极快（毫秒级），但新文件需等待索引更新（或手动 `updatedb`）才能被找到。它支持正则表达式，适合模糊匹配。

**语法**：
```
locate [选项] 模式
```

**常用选项**：
- `-i`：忽略大小写。
- `-r`：使用正则表达式匹配（正则需转义）。
- `-c`：只计数匹配数，不列出路径。
- `-S`：显示数据库统计信息。

**示例**：
- 查找所有包含 "config" 的文件：`locate config`  
  输出：大量路径，如 `/etc/config`、`/home/user/.config` 等。
- 正则匹配以 "pdf" 结尾的文件：`locate -r '\.pdf$'`  
  输出：所有 PDF 文件路径。
- 更新数据库：`sudo updatedb`（然后再搜索新文件）。

**优缺点**：
- **优点**：速度最快、范围广（全系统）、支持高级过滤。
- **缺点**：依赖数据库，可能有延迟（新/删文件不实时）；返回结果多，需过滤；不检查文件是否存在（数据库可能过时）。
- **使用场景**：日常快速搜索文件名，如找配置文件或日志；适合大文件系统。

**注意**：在一些发行版（如 Ubuntu），`locate` 是 `mlocate` 的别名。首次使用需 `sudo updatedb` 初始化数据库。

#### 4. `find` 命令
**核心功能**：`find` 是功能最强大的文件搜索工具，能从指定目录（默认根目录 `/`）开始递归搜索整个文件系统，支持文件类型、权限、大小、时间等复杂条件。它不依赖索引，实时扫描磁盘。

**原理**：从起点目录开始深度优先遍历所有子目录，应用过滤条件。速度慢（尤其在大系统上），但灵活性最高，支持执行命令（如删除匹配文件）。

**语法**：
```
find [路径] [选项] 表达式
```

**常用选项和表达式**：
- `-name "pattern"`：匹配文件名（支持 `*` 通配符，大小写敏感）。
- `-iname "pattern"`：忽略大小写。
- `-type f/d`：只找文件（f）或目录（d）。
- `-size +10M`：大于 10MB 的文件。
- `-mtime -7`：修改时间在 7 天内的文件。
- `-exec command {} \;`：对匹配项执行命令（如 `find . -name "*.tmp" -exec rm {} \;` 删除临时文件）。

**示例**：
- 从当前目录找所有 `.txt` 文件：`find . -name "*.txt"`  
  输出：相对路径列表。
- 找根目录下大于 100MB 的文件：`sudo find / -size +100M -type f`  
  输出：全路径列表（可能需几分钟）。
- 结合执行：`find /home -name "*.log" -mtime +30 -exec gzip {} \;`（压缩 30 天前的日志）。

**优缺点**：
- **优点**：功能全面、可组合条件、实时准确（无数据库延迟）。
- **缺点**：速度最慢（O(n) 遍历整个树）；默认从 `/` 搜可能耗时长，需 sudo 权限。
- **使用场景**：前三个命令失败时使用，或需高级过滤（如按权限/时间找文件）；系统维护任务。

**注意**：为加速，总是指定小范围路径（如 `find /home/user`）。在 SSD 上较快，但 HDD 上可能很慢。输出可管道到 `xargs` 或 `grep` 进一步处理。

### 总结比较
以下表格对比四个命令的关键差异，便于快速参考：

| 命令     | 搜索范围          | 速度   | 支持文件类型     | 依赖性          | 最佳场景                  |
|----------|-------------------|--------|------------------|-----------------|---------------------------|
| **which** | $PATH（最小）    | 极快  | 只可执行文件    | 无             | 验证命令路径             |
| **whereis** | $PATH + 系统目录 | 快    | 命令/源/man/文件 | 无             | 快速找文档或二进制       |
| **locate** | 全系统（数据库） | 超快  | 任意文件        | 索引数据库     | 模糊搜索大量文件         |
| **find**  | 指定目录（默认/）| 慢    | 任意 + 条件过滤 | 无             | 复杂条件或实时搜索       |

这些命令互补使用，能覆盖从简单到高级的查找需求。如果您在特定 Linux 发行版（如 CentOS/Ubuntu）上有疑问，或需更多示例代码，我可以进一步扩展！