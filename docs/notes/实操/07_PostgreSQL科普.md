---
title: 07_PostgreSQL科普
createTime: 2025/12/07 09:23:41
permalink: /notes/实操/d6217rzf/
---

## 一、基础概念

### 1. 索引（Index）
- 作用：极大加速查询，像书的“目录”
- 建立在表的某个字段（列）上，不是某个具体值
- 常用命令：
  ```sql
  \di                  -- 查看所有索引
  \di+                 -- 更详细
  SELECT * FROM pg_indexes WHERE tablename='表名';
  ```

**什么时候该建索引？**
| 指标           | 适合建索引                                 | 不适合建索引                     |
|----------------|--------------------------------------------|----------------------------------|
| 选择性（区分度）| 高（id、username、email 等几乎唯一）       | 低（gender、status、is_deleted） |
| 查询频率       | 经常作为 WHERE、JOIN、ORDER BY 的条件      | 几乎不查询                       |

**运维的正确做法**：
1. 用 `EXPLAIN` 看 SQL 是否走了索引
2. 发现慢查询 → 报给开发
3. 绝不在生产环境自己建索引（会锁表、影响写入）

### 2. 函数（Function / Stored Procedure）
- 命令：`\df` / `\df+`
- 作用：把复杂业务逻辑写在数据库里
- 运维基本不用写，但要知道有这东西存在

### 3. 用户/角色（Role）
- 命令：`\du` / `\du+`
- 控制谁能登录、读、写、创建表、备份等

### 4. 常用 psql 快捷命令
| 命令      | 作用                   |
|-----------|------------------------|
| \d        | 查看表结构             |
| \d+       | 查看表结构+注释+大小   |
| \di       | 查看索引               |
| \df       | 查看函数               |
| \du       | 查看用户/角色          |
| \l        | 查看数据库             |
| \dt       | 查看所有表             |
| \dn       | 查看 schema            |

## 二、性能排查核心：EXPLAIN

### 1. EXPLAIN 和 EXPLAIN ANALYZE
| 命令                  | 作用                                      | 是否真的执行 |
|-----------------------|-------------------------------------------|--------------|
| EXPLAIN               | 只看执行计划，不执行                      | 不执行       |
| EXPLAIN ANALYZE       | 真正执行，并显示实际耗时、行数            | 会执行       |

**注意**：生产环境谨慎使用 `EXPLAIN ANALYZE` 特别是带 UPDATE/DELETE 的语句！

### 2. 关键看这几行
- `Seq Scan` → 全表扫描（小表正常，大表危险）
- `Index Scan` / `Index Only Scan` → 走了索引（好）
- `cost=...` 越小越好
- `rows=...` 预估返回行数
- `actual time=... rows=... loops=...` 实际耗时和行数（ANALYZE 才有）

## 三、事务与锁（卡死问题必备）

### 1. 常见锁类型
| 锁类型          | 常见场景                         | 影响范围     |
|-----------------|----------------------------------|--------------|
| 行级锁          | UPDATE、DELETE、SELECT FOR UPDATE | 单行         |
| 表级锁          | ALTER TABLE、CREATE INDEX、VACUUM FULL | 全表阻塞     |

### 2. 排查锁的三大命令
```sql
-- 1. 查看当前所有连接和正在执行的 SQL
SELECT pid, usename, state, query, now()-query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle';

-- 2. 找出谁被谁阻塞（最常用！）
SELECT pid, 
       pg_blocking_pids(pid) AS blocked_by,
       query
FROM pg_stat_activity
WHERE pg_blocking_pids(pid) <> '{}';

-- 3. 查看详细锁信息
SELECT * FROM pg_locks WHERE NOT granted;  -- 未获得的锁
```

### 3. 终极杀手（谨慎使用）
```sql
SELECT pg_terminate_backend(pid);  -- 杀掉某个卡死进程
```

## 四、系统视图 & 系统表（pg_catalog）速查表

### 普通视图和系统视图
```查看已有的普通视图
\dv
```
普通视图可以理解为："SQL语句的别名"
```创建视图
create view my_active_users as
select * from users where active = true;
```
这句话的意思基本上就是把"users"这张表的内容进行了再加工，挑选一些常用的字段组成一张"新表"，方便用户快速调用。



| 用途               | 推荐命令 / 系统表                     |
|-------------------|---------------------------------------|
| 看表结构           | \d 表名 或 pg_class + pg_attribute    |
| 看所有索引         | \di 或 pg_indexes                     |
| 看表大小           | SELECT pg_size_pretty(pg_total_relation_size('表名')); |
| 看当前连接和 SQL   | pg_stat_activity                      |
| 看谁阻塞谁         | pg_blocking_pids(pid)                 |
| 看锁               | pg_locks                              |
| 看表被扫描次数     | pg_stat_user_tables                   |
| 看索引使用率       | pg_stat_user_indexes                  |
| 看慢 SQL（需安装扩展）| pg_stat_statements                 |
| 看用户权限         | pg_roles                              |
| 看配置             | pg_settings 或 SHOW ALL;              |

## 五、技术支持日常工作流程（遇到卡顿/慢查询）

1. 客户反馈“页面卡住” → 登录数据库
2. 执行：
   ```sql
   SELECT pid, now()-query_start, query FROM pg_stat_activity WHERE state='active';
   ```
3. "now()-query_start"指的是现在的时间减去该SQL开始的时间，来判断SQL跑了多久了
4. 执行 `EXPLAIN ANALYZE` 这条 SQL
5. 看到 `Seq Scan` + 几百万行 → 基本确定缺索引
6. 把 SQL + EXPLAIN 结果发给开发，说：“建议在 xx 字段加索引”
7. 如果是锁问题 → 用 pg_blocking_pids 找元凶 → 必要时杀进程

## 六、想把数据库的表导成csv
有时候会遇到想要把数据库里面的记录全拿出来挨个分析的情况，在DDI的后台用SELECT命令也不怎么方便，此时我们可以使用\copy命令，默认导出的csv表在/root/路径下
```
 \copy （表名） TO '(表名).csv' CSV HEADER; 
```

## 七、备份基础概念（了解即可）

| 命令          | 作用                     |
|---------------|------------------------|
| pg_dump       | 逻辑备份（SQL 文本）     |
| pg_dumpall    | 备份所有数据库+用户      |
| pg_restore    | 恢复 pg_dump 出来的文件  |
| 物理备份      | basebackup / WAL 归档    |

### pg_dump进行备份
1.将整个数据库备份成一堆SQL语句，比如数据库里面的表怎么CREATE，表里的数据就都是INSERT
```
pg_dump dns > dns_full_20251207.sql
# 恢复的时候就: psql dns < /tmp/dns_full_20251207.sql
```
2.备份成压缩的自定义格式（体积小 5~20 倍，恢复用 pg_restore）
```
pg_dump -Fc dns > dns_full_20251207.dump
# 恢复的时候就:pg_restore -d dns /tmp/dns_backup_20251207.dump
```
3. 只备份表结构（不带数据，常用于生成建表语句给开发）
```
pg_dump -s dns > dns_schema_only.sql
```