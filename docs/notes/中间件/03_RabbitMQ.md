---
title: 03_RabbitMQ
createTime: 2025/12/24 17:46:29
permalink: /notes/中间件/erbcyqjb/
---

# RabbitMQ 是什么？

RabbitMQ 是一个“消息中间件（Message Broker）”。

👉 通俗地说：

它是一个“消息快递站”，负责在不同程序之间安全、可靠地传递消息。

## 为什么需要 RabbitMQ？
在真实系统里，经常是这样的：

* 程序A要把一条消息交给程序B 

但：
* B 可能还没启动
* B 处理很慢
* A 和 B 用的是不同语言
* A 不想一直等 B

这时就用 RabbitMQ 当中间人：
程序 A  --->  RabbitMQ  --->  程序 B
* A 把消息放进 RabbitMQ 就走了 ---> B 什么时候有空，什么时候来取
