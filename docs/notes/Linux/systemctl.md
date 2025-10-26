---
title: systemctl
createTime: 2025/10/22 16:47:04
permalink: /notes/Linux/z4cszob4/
---
# Systemd 服务排查与管理心得

## 一、常用的服务查看与管理命令

### 1. 列出当前已加载的服务
查看系统中所有已加载的服务单元（包括是否运行、是否失败等）：
```bash
systemctl list-units --type=service
```

### 2. 查看单个服务的详细状态
```bash
systemctl status <service>
```
示例：
```bash
systemctl status nginx
```

### 3. 启动、停止、重启与设置开机自启
```bash
systemctl start <service>
systemctl stop <service>
systemctl restart <service>
systemctl enable <service>    # 设置开机自启
systemctl disable <service>   # 取消开机自启
```

### 4. 查看服务对应的 unit 文件
```bash
systemctl cat <service>
```
或直接查看物理路径：
```
/usr/lib/systemd/system/<service>.service
```

---

## 二、Systemd 服务异常排查标准流程

当某个服务启动失败时，可按照以下步骤进行分析与定位。

### 步骤 1：查看服务状态
```bash
systemctl status <service>
```
查看失败原因概要（通常可看到最近的错误日志片段）。

### 步骤 2：查看详细日志
```bash
journalctl -u <service> -b
```
说明：  
`-u` 指定服务单元，`-b` 表示仅查看本次开机后的日志。

### 步骤 3：检查服务配置文件
```bash
systemctl cat <service>
```
确认配置路径、依赖、启动命令等是否正确。

### 步骤 4：尝试手动启动服务
在命令行中直接运行 `ExecStart` 中的启动命令，观察是否有错误提示。  
这一步可帮助判断问题出在 systemd 本身还是程序配置上。

### 步骤 5：检查依赖与系统资源
| 问题类型 | 检查方法 |
|-----------|-----------|
| 依赖服务是否正常 | `systemctl status <dependency>`（如 `dbus`、`network` 等） |
| 端口被占用 | `ss -lntp` 或 `lsof -i` |
| 权限 / SELinux 问题 | `getenforce`、`ls -Z` |
| 内存或文件句柄不足 | `dmesg` 查看内核日志 |

---

## 三、补充建议
- 若服务长期启动失败，可执行：
  ```bash
  journalctl -xe
  ```
  查看系统级错误详情。  
- 服务配置修改后需执行：
  ```bash
  systemctl daemon-reload
  ```
  让 systemd 重新加载配置。  
- 若要恢复服务默认配置，可使用：
  ```bash
  systemctl revert <service>
  ```
