---
title: postgres数据库
createTime: 2025/11/07 14:41:13
permalink: /notes/Linux/96519kib/
---


# **PostgreSQL 日常运维速查手册**  
**版本 v1.2｜2025-11-06**

---

## 连接 PostgreSQL

```bash
# 常用端口连接
psql -U postgres -p 5450
psql -U postgres -p 5435

# 免输密码（临时）
export PGPASSWORD='your_password'
psql -U postgres -p 5450
```

### psql 元命令

| 命令 | 功能 |
|------|------|
| `\l` | 列出数据库 |
| `\c dbname` | 切换数据库 |
| `\dt` | 列出表 |
| `\d tablename` | 查看表结构 |
| `\q` | 退出 |

---

## 数据库与表管理

```sql
-- 创建/删除数据库
CREATE DATABASE mydb ENCODING 'UTF8';
DROP DATABASE IF EXISTS mydb;

-- 查看表结构 + 样例数据
\d auth_zone
SELECT * FROM auth_zone LIMIT 1;

-- 创建表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 删除表
DROP TABLE IF EXISTS users;
```

---

## 数据查询与分析

```sql
-- 基础查询
SELECT * FROM auth_zone LIMIT 5;
SELECT id, zone_name FROM auth_zone WHERE id > 100;

-- 统计
SELECT COUNT(*) FROM auth_zone;
SELECT type, COUNT(*) FROM auth_zone GROUP BY type;
SELECT DISTINCT zone_name FROM auth_zone;

-- 排序分页
SELECT * FROM auth_zone 
ORDER BY serial DESC 
LIMIT 10 OFFSET 20;
```

---

## 异常数据定位

```sql
-- 空值
SELECT * FROM auth_zone WHERE zone_name IS NULL OR zone_name = '';

-- 重复值
SELECT zone_name, COUNT(*) 
FROM auth_zone 
GROUP BY zone_name 
HAVING COUNT(*) > 1;

-- 非法值
SELECT * FROM auth_zone WHERE serial IS NULL OR serial <= 0;

-- 超长字符串
SELECT * FROM auth_zone WHERE LENGTH(zone_name) > 253;
```

---

## 数据修复（删除/修改）

```sql
-- 1. 预览
SELECT * FROM auth_zone WHERE zone_name IS NULL;

-- 2. 备份
CREATE TABLE auth_zone_bak_20251106 AS TABLE auth_zone;

-- 3. 删除
DELETE FROM auth_zone WHERE zone_name IS NULL;

-- 修改
UPDATE auth_zone 
SET serial = EXTRACT(EPOCH FROM NOW())::bigint 
WHERE serial < 1000000000;

-- 清空表
TRUNCATE TABLE auth_zone RESTART IDENTITY;
```

---

## 备份与安全

```bash
# 备份单表
pg_dump -U postgres -p 5450 -t auth_zone dns > auth_zone_backup.sql

# 恢复
psql -U postgres -p 5450 -d dns < auth_zone_backup.sql
```

```sql
-- SQL 内快速备份
CREATE TABLE auth_zone_backup AS TABLE auth_zone;
```

---

## 性能监控与维护

```sql
-- 查看大表
SELECT 
    schemaname || '.' || tablename AS table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_tup_ins - n_tup_del AS rows
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size DESC 
LIMIT 10;

-- 检查死元组
SELECT relname, n_dead_tup, last_autovacuum 
FROM pg_stat_user_tables 
WHERE n_dead_tup > 10000;

-- 清理
VACUUM auth_zone;
VACUUM FULL auth_zone;  -- 锁表
```

---

## 速查表

```sql
-- 一键大表
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::regclass)) 
FROM pg_tables WHERE schemaname='public' 
ORDER BY pg_total_relation_size DESC LIMIT 10;

-- 看结构 + 数据
\d your_table
SELECT * FROM your_table LIMIT 1;

-- 找空值
SELECT * FROM your_table WHERE col IS NULL;

-- 备份
CREATE TABLE your_table_bak AS TABLE your_table;

-- 删除
DELETE FROM your_table WHERE col IS NULL;

-- 验证
SELECT COUNT(*) FROM your_table WHERE col IS NULL;  -- 应为 0
```

---
