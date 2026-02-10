---
title: redis
createTime: 2025/12/24 17:07:55
permalink: /notes/中间件/gzbpurt4/
---

# Redis 运维核心知识整理

## 一、Redis 运维需要掌握的核心内容

### 1. Redis 基础知识

- **数据类型**：
  - String
  - Hash
  - List
  - Set
  - Sorted Set
  - Stream 等

- **基本命令**：
  - GET、SET
  - HGET/HSET
  - LPUSH/LPUSHX
  - SADD
  - ZADD
  - EXPIRE 等

- **持久化方式**：
  - RDB（快照）
  - AOF（Append Only File）
  - 混合持久化（Redis 7+）

- **内存管理**：
  - 内存淘汰策略（volatile-lru、allkeys-lru 等）
  - 内存占用监控（INFO memory）

### 2. 部署与架构

- **单节点部署**：
  - 基本安装、启动、配置文件

- **主从复制（Master-Slave）**：
  - 读写分离，数据备份

- **哨兵模式（Sentinel）**：
  - 高可用，自动故障切换

- **Cluster 集群模式**：
  - 分片（Sharding）、水平扩展、Slot 概念

- **持久化配置优化**：
  - RDB/AOF 触发条件
  - fsync 策略
  - 内存压缩和对象编码（ziplist、intset 等）

### 3. 监控与运维

- **状态监控**：
  - INFO 命令（CPU、内存、客户端、复制、持久化）
  - 客户端连接数、慢查询（SLOWLOG）
  - 哨兵状态、集群状态

- **日志与报警**：
  - redis.log 配置、日志级别
  - 常见报警指标：内存使用率、延迟、慢查询、实例不可用

### 4. 安全性

- 绑定 IP、密码认证（requirepass）
- 配置只读从节点
- 防火墙和访问控制列表（ACL，Redis 6+）

### 5. 备份与恢复

- RDB/AOF 手动备份
- 恢复数据到新节点
- 集群数据迁移

### 6. 性能优化

- 避免大 Key 或大 List/Set/Hash（容易阻塞）
- 使用管道（Pipeline）批量操作
- 合理设置过期时间（TTL）
- 内存优化策略：对象编码、内存淘汰策略
- 客户端连接池和请求压测

## 二、Redis 常见问题（运维视角）

### 1. 实例不可用
- **原因**：Redis 服务未启动、配置错误、端口被占用
- **排查**：`ps -ef | grep redis`、`redis-cli ping`

### 2. 内存不足 / OOM
- **原因**：Key 太多，淘汰策略不合理
- **排查**：INFO memory，查看 used_memory、maxmemory，分析大 Key

### 3. 慢查询 / 阻塞
- **原因**：单个命令耗时过长（如 KEYS *、大集合操作）
- **排查**：SLOWLOG GET、MONITOR，分析热点命令

### 4. 主从同步问题
- **原因**：网络延迟、带宽不足、AOF/RDB 过大
- **排查**：INFO replication，查看 master_link_status、slave_repl_offset

### 5. 持久化文件损坏
- **原因**：磁盘写入异常、意外断电
- **排查**：查看 redis.log，RDB/AOF 重写失败日志
- **恢复**：从备份 RDB/AOF 恢复

### 6. 集群节点不可用
- **原因**：节点宕机、网络分区
- **排查**：`redis-cli -c cluster nodes`，Sentinel 日志
- **处理**：故障切换，重新分配 slot

### 7. 客户端连接异常
- **原因**：连接数过多、慢查询阻塞、网络不稳定
- **排查**：CLIENT LIST、慢日志
- **优化**：连接池、限制最大客户端数、配置 timeout

## 三、建议学习路线（运维角度）

1. 熟悉 Redis 基础命令和数据类型
2. 学会部署单节点实例，理解持久化配置
3. 学会配置主从复制和哨兵，模拟故障切换
4. 学习 Redis Cluster，理解 slot 分配和迁移
5. 学会常用监控、慢查询分析、内存分析
6. 学会备份、恢复和性能调优