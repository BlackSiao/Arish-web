---
title: cheat_shell
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