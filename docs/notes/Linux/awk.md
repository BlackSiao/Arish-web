---
title: awk
createTime: 2025/09/22 22:31:58
permalink: /notes/Linux/85muhzy2/
---
# AWK

*Created: 2025/09/22 22:31:58*

## 1. AWK 的基本语法

AWK 的命令格式通常是：

```bash
awk '匹配条件 {动作}' 文件名
```

- **匹配条件（Pattern）**：可选，指定哪些行要处理（如正则匹配或条件判断）。如果省略，所有行都处理。假设awk命令是一条数据库命令，则Pattern的填写就如同SELECT语句。
```Pattern
面对一个这样的query.log日志
20-Sep-2025 17:34:52.507 client 127.0.0.2 61096: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 82 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;
20-Sep-2025 17:34:53.532 client 127.0.0.1 54284: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 78 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;
20-Sep-2025 17:34:55.490 client 127.0.0.1 57371: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 74 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;

# 可以简单的实现对整个日志文件进行提取
awk '$4 == "127.0.0.2" {print}' query.log
# 对于模糊搜索项, 也可以用 /搜索值/ 来定位到对应的日志行
awk '/127.0.0.2/ {print}' query.log
```
- **动作（Action）**：用 `{}` 包裹，当使用Pattern选中了要进行操作的行后，就可以通过Action来对齐进行操作了 
```Action
# 打印输出
awk 'Pattern {print $0}' query.log      # 相当于打印出query.log被Pattern选中的行
awk 'Pattern {print $1, $2}' query.log  # 相当于打印出query.log被Pattern选中的行中的第一和第二个字段

# 条件语句
awk 'Pattern {if ($4 == "127.0.0.2") print $0; else print "No matching!"}' query.log.

# 特别要理解Action是逐一对/Pattern/匹配到的每一行，单独进行Action的
20-Sep-2025 17:34:52.507 client 127.0.0.2 61096: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 82 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;
20-Sep-2025 17:34:53.532 server 127.0.0.2 54284: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 78 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;
20-Sep-2025 17:34:55.490 hero 127.0.0.2 57371: view default: dns1.monitormyselfisok IN A NOERROR - NS NE NT ND NC L 0 0 0 0.000000 NW NA NA N FD source client NA NTN 74 Response: dns1.monitormyselfisok. 5 IN A 127.0.0.1;

arish@LAPTOP-5SC95QR5:~$ awk '/127.0.0.2/ {if ($3 == "client") print "yes, my lord"; else print "you are lier"}' query.log
yes, my lord
you are lier
you are lier
```
- **文件名**：输入文件，可以是日志路径。输出默认到终端，也可以重定向到文件（`> output.txt`）。

AWK 把每行日志视为“记录”（record），用分隔符（默认空格或制表符）拆分成“字段”（field），用 `$1`、`$2`... 表示第一个、第二个字段；`$0` 是整行。

用 `-F` 指定自定义分隔符（如 `-F ":"` 对于冒号分隔的日志）。

**例子**：假设日志文件 `access.log` 内容是（简化版 Apache 日志）：

```
192.168.1.1 - - [22/Sep/2025:10:00:00] "GET /index.html" 200 1234
192.168.1.2 - - [22/Sep/2025:10:01:00] "POST /login" 404 567
```

运行：

```bash
awk '{print $1, $5}' access.log
```

**输出**：

```
192.168.1.1 "GET
192.168.1.2 "POST
```

这里打印第一个字段（IP）和第五个字段（请求方法）。

## 2. 内置变量：让 AWK 更智能

AWK 有许多内置变量，简化日志处理：

- `$0`：整行。
- `$n`：第 n 个字段。
- `NF`：当前行字段数（Number of Fields）。
- `NR`：当前行号（Number of Records）。
- `FS`：字段分隔符（Field Separator，默认空格）。
- `BEGIN {}`：在处理文件前执行（初始化变量）。
- `END {}`：处理完所有行后执行（输出总结）。

**例子**：统计日志行数（总记录数）：

```bash
awk 'END {print "总行数: " NR}' /var/log/syslog
```

在文件末尾打印 `NR`（行号，即总行）。

## 3. 常见操作符和控制语句

- **比较操作符**：`==`（等于）、`!=`（不等于）、`>`、`<` 等。
- **逻辑操作符**：`&&`（与）、`||`（或）。
- **正则匹配**：`~` 或 `!~`（如 `$1 ~ /error/` 匹配包含 "error" 的字段）。
- **控制语句**：`if`、`else`、`for`、`while`（像小程序）。

**例子**：过滤包含 "error" 的行：

```bash
awk '/error/ {print $0}' /var/log/syslog
```

`/error/` 是模式，只处理匹配行。

## 4. 日志分析的实用例子

AWK 在日志处理上的“出彩”点：可以结合 regex 精确匹配模式（如时间戳 `[0-9]{4}-[0-9]{2}-[0-9]{2}` 或 IP `[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}`），提取关键信息。

### 示例 1: 提取特定字段（比如 IP 和状态码）

```bash
awk '{print $1, $9}' access.log
```

**输出**：

```
192.168.1.1 200
192.168.1.2 404
```

提取 IP（`$1`）和状态码（`$9`）。比 vi 搜索快多了。

### 示例 2: 统计错误次数（计数失败登录）

针对 `/var/log/auth.log`（SSH 日志）：

```bash
awk '($6 == "Failed" && $7 == "password") {count++} END {print "失败登录次数: " count}' /var/log/auth.log
```

- **模式**：第六字段是 "Failed" 且第七是 "password"。
- **动作**：递增计数器 `count`。
- **END**：输出总数。

### 示例 3: 按日期过滤（比如只看今天日志）

```bash
awk '$1 == "Sep" && $2 == "22" {print $0}' /var/log/syslog
```

过滤月份（`$1`）和日期（`$2`）匹配的行。

### 示例 4: 使用 regex 匹配 IP 并计数

```bash
awk '$NF ~ /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/ {ip_count[$NF]++} END {for (ip in ip_count) print ip, ip_count[ip]}' /var/log/auth.log
```

- 匹配最后字段（`$NF`）的 IP 模式。
- 用数组 `ip_count` 统计每个 IP 出现次数。
- **END**：遍历数组输出（如 "192.168.1.1 5"）。

### 示例 5: 求和（比如总响应大小）

```bash
awk '{sum += $10} END {print "总响应大小: " sum " bytes"}' access.log
```

累加第十字段（响应大小）。

## 5. 高级技巧：结合其他工具

- **实时监控**：`tail -f /var/log/syslog | awk '/error/ {print $0}'`（只显示错误行）。
- **脚本化**：把 AWK 代码写到文件 `myscript.awk`，运行 `awk -f myscript.awk log.file`。
- **与 grep/sed 结合**：AWK 更强在计算，grep 更强在简单搜索。

