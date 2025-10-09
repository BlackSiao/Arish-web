---
title: shell
createTime: 2025/09/21 22:31:00
permalink: /notes/Linux/27etczvk/
---
# Linux 常用命令与 Shell 脚本基础

本文整理了一些常用的 Linux 命令（如 `mkdir`、`tar` 和 `find`）以及 Shell 脚本的基础知识，适合初学者快速上手或作为参考。这些内容可以帮助你在 Linux 系统中高效管理文件和编写简单的自动化脚本。

.0

## 2. Shell 脚本基础

Shell 脚本是自动化任务的强大工具，以下从基础入手，逐步介绍 Shell 脚本的编写方法。

### 2.1 第一个 Shell 脚本

**示例：创建一个简单的 Shell 脚本，输出 "Hello World!"**

```bash
#!/bin/bash
echo "Hello World!"
```

**说明：**

- `#!/bin/bash`：称为 shebang，指定脚本使用的解释器（这里是 `/bin/bash`）。
- `echo`：输出文本到终端。

**运行方法：**

1. 保存脚本为 `hello.sh`。
2. 添加执行权限：

```bash
chmod +x hello.sh
```

3. 运行脚本：

```bash
./hello.sh
```

### 2.2 Shell 变量

Shell 变量用于存储数据，通常被视为字符串。

**定义变量：**

```bash
your_name="Hello World"
```

*注意：变量名和等号之间不能有空格。*

**使用变量：**

用 `$` 引用变量，推荐用花括号 `{}` 包裹变量名以避免歧义：

```bash
skill="Bash"
echo "I am good at ${skill}Script"
```

**输出：**

```
I am good at BashScript
```

如果不加 `{}`，Shell 会将 `skillScript` 视为一个变量名，可能导致错误。

**删除变量：**

```bash
unset your_name
```

删除后，变量无法再次使用。

*注意：*`unset` *不能删除只读变量（用* `readonly` *声明的变量）。*

**变量类型：**

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| 字符串变量 | 默认将变量视为字符串 | `name="Alice"` |
| 整数变量 | 使用 `declare -i` 声明整数 | `declare -i num=42` |
| 数组变量 | 支持一维数组，存储多个值 | `array=(1 2 3)` |
| 环境变量 | 系统或用户设置，影响 Shell 行为 | `echo $PATH` |
| 特殊变量 | 具有特殊含义，如 `$0`（脚本名）、`$#`（参数数量） | `echo $0` |

**字符串操作：**

- 获取字符串长度：

```bash
string="abcd"
echo ${#string}  # 输出 4
```

- 提取子字符串：

```bash
string="runoob is a great site"
echo ${string:1:4}  # 输出 unoo
```

- 查找子字符串：

```bash
string="runoob is a great site"
echo `expr index "$string" io`  # 输出 4
```

**数组操作：**

```bash
array_name=(value0 value1 value2 value3)
echo ${array_name[1]}  # 输出 value1
echo ${#array_name[@]}  # 输出数组长度 4
```

### 2.3 Shell 注释

**单行注释：**

```bash
# 这是一个单行注释
echo "Hello"
```

**多行注释：**

Shell 不支持直接的多行注释，但可以通过定义未调用的函数来实现：

```bash
: <<EOF
echo "This is a comment"
echo "This will not execute"
EOF
```

或将代码放入未调用的函数：

```bash
my_function() {
    echo "This is commented out"
    echo "No execution"
}
```

### 2.4 特殊变量

| 变量 | 说明 |
| --- | --- |
| `$0` | 当前脚本的名称 |
| `$1`, `$2`, ... | 传递给脚本的第 1、第 2 个参数 |
| `$#` | 传递给脚本的参数数量 |
| `$?` | 上一个命令的退出状态（0 表示成功，非 0 表示失败） |
| `$PATH` | 环境变量，存储可执行文件的搜索路径 |

**示例：**

```bash
#!/bin/bash
echo "Script name: $0"
echo "First argument: $1"
echo "Number of arguments: $#"
echo "Last command status: $?"
```

保存为 `test.sh`，运行 `./test.sh arg1 arg2`，输出：

```
Script name: ./test.sh
First argument: arg1
Number of arguments: 2
Last command status: 0
```

## 3. 总结

通过掌握 `mkdir`、`tar` 和 `find` 等命令，以及 Shell 脚本的基础知识，你可以高效地管理 Linux 系统中的文件和自动化任务。建议将这些命令和脚本实践结合，逐步熟悉其用法。

**进一步学习建议：**

- 深入学习 `find` 的其他参数，如 `-mtime`（按修改时间查找）。
- 尝试编写复杂的 Shell 脚本，结合条件语句和循环。
- 探索 `awk` 和 `sed` 等工具，增强文本处理能力。

## 附录：Shell 数组详解

### 普通数组

Bash Shell 只支持一维数组（不支持多维数组），初始化时不需要定义数组大小。

**示例：**

```bash
my_array=(A B "C" D)
echo "第一个元素为: ${my_array[0]}"
echo "第二个元素为: ${my_array[1]}"
```

*注意：大多数 Linux/WSL 环境里，*`sh` *并不是* `bash`*，而是链接到* `dash`*（一个精简版 shell）。*`dash` *不支持数组语法* `()`*，所以如果你用* `sh script.sh` *会报错：*

```
Syntax error: "(" unexpected
```

请使用以下方式运行：

```bash
bash script.sh
# 或者
./script.sh
```

### 关联数组

Bash 还支持关联数组，即可以用字符串作为下标（类似键值对）。

**声明语法：**

```bash
declare -A array_name
```

`-A` 选项表示声明一个关联数组。关联数组的键必须唯一。

**示例 1：初始化时赋值**

```bash
declare -A site=(
    ["google"]="www.google.com"
    ["runoob"]="www.runoob.com"
    ["taobao"]="www.taobao.com"
)
echo "Google: ${site["google"]}"
```

**示例 2：先声明再赋值**

```bash
declare -A site
site["google"]="www.google.com"
site["runoob"]="www.runoob.com"
site["taobao"]="www.taobao.com"
echo "Runoob: ${site["runoob"]}"
```

**获取数组内容：**

| 操作 | 命令 |
| --- | --- |
| 获取所有元素 | `echo ${my_array[*]}` 或 `echo ${my_array[@]}` |
| 获取所有键 | `echo ${!site[*]}` 或 `echo ${!site[@]}` |
| 获取数组长度 | `echo ${#my_array[*]}` 或 `echo ${#my_array[@]}` |

**输出示例：**

```
数组的元素为: A B C D
数组的键为: google runoob taobao
数组元素个数为: 4
```

**总结：**

- `$n` 用于获取传递给脚本的参数。
- 普通数组使用括号 `()` 定义，下标从 0 开始。
- 关联数组使用 `declare -A` 声明，支持字符串键。
- 使用 `@` 或 `*` 获取所有元素，用 `!` 获取所有键，用 `#` 获取数组长度。

## 4. 学习 `sh` 命令：`awk` 和 `sed`

### 磁盘 IO 监控

```bash
iostat -x 1   # 查看实时 IO
```

### `expr` 命令

`expr` 命令中运算符两侧必须有空格。

完整的表达式要用反引号 `` ` `` 包含（注意不是单引号）。

**示例：**

```bash
expr 2 + 2
```

### 条件表达式

条件表达式必须放在方括号 `[]` 内，并且要有空格。以下是常见错误：

- `[$a==$b]` ❌
- `[ $1 ==$b ]` ❌

**正确写法：**

```bash
[ $a == $b ]
```

### 逻辑运算符

- `!` → 非运算
- `-o` → 或运算
- `-a` → 与运算

### `let` 命令

`let` 命令允许对整数进行算术运算。

```bash
# 自增
let num++

# 自减
let num--
```

### `vi` 编辑器 Visual 模式

进入 Visual 模式后：

- `y` → 复制文本到寄存器
- `p` → 粘贴文本
- `d` → 剪切文本

### `echo` 的高级用法

- 覆盖写入文件：

```bash
echo "This will be saved to file" > output.txt
```

- 清空文件：

```bash
echo > output.txt
```

- 追加内容到文件：

```bash
echo "Additional line" >> output.txt
```

### `test` 命令

`test` 命令常用于检查文件属性。常见选项如下：

| 操作符 | 描述 | 示例 |
| --- | --- | --- |
| `-e` | 文件是否存在 | `[ -e file.txt ]` |
| `-f` | 普通文件 | `[ -f /path/to/file ]` |
| `-d` | 目录 | `[ -d /path/to/dir ]` |
| `-r` | 可读 | `[ -r file.txt ]` |
| `-w` | 可写 | `[ -w file.txt ]` |
| `-x` | 可执行 | `[ -x script.sh ]` |
| `-s` | 文件大小 &gt; 0 | `[ -s logfile ]` |
| `-L` | 符号链接 | `[ -L symlink ]` |

### 流程控制

和 Java / PHP 等语言不同，Shell 的流程控制不可为空。

**示例（PHP 写法）：**

```php
if (isset($_GET["q"])) {
    search(q);
} else {
    // 不做任何事情
}
```

在 Shell 中，若没有操作，直接省略 `else` 部分：

```bash
if condition1
then
    command1
elif condition2
then 
    command2
else
    commandN
fi
```

### 循环

#### `for` 循环

```bash
for var in item1 item2 ... itemN
do
    command1
    command2
    ...
    commandN
done
```

#### `while` 循环

# while condition\\

do\
command\
done