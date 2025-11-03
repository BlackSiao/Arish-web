---
title: 中间件
createTime: 2025/10/27 10:34:42
permalink: /notes/Linux/0shiu18v/
---
## 中间件是什么

中间件(英语：Middleware)，是一类提供OS和软件之间连接、便于软件各部件之间的沟通的软件，应用软件可以借助中间件在不同的技术架构之间共享信息与资源。中间件位于客户机服务器的操作系统之上，管理着计算资源和网络通信。

实际上中间件也只是一种称呼，我们只需要明白中间件所对应的特征为:
   - 不直接对用户提供服务
   - 却是支持整个系统正常运行的"骨架"

之所以要了解中间件，也是因为大部分的应用软件都要使用通用的中间件进行代理、工作，因此大部分运维的招聘上都写着要熟悉常用中间件的配置和运维。

## 常见的中间件介绍
| 名称                    | 类型            | 主要功能             | 运维常做的事                |
| --------------------- | ------------- | ---------------- | --------------------- |
| **Nginx**             | Web服务器 / 反向代理 | 分发请求、负载均衡、静态文件服务 | 部署、配置虚拟主机、反代、SSL、负载均衡 |
| **Tomcat**            | Java应用服务器     | 运行Java Web应用     | 部署war包、配置线程池、调优       |
| **Redis**             | 缓存中间件（NoSQL）  | 存储会话、缓存热点数据      | 安装、主从复制、持久化、性能监控      |
| **MySQL**             | 数据库           | 关系型数据存储          | 数据备份、主从复制、参数优化        |
| **Kafka/RabbitMQ**    | 消息队列中间件       | 异步通信、削峰填谷        | 部署、监控、消息积压处理          |
| **Zookeeper/Etcd**    | 注册中心          | 服务注册、配置管理        | 配置同步、健康检查             |
| **Elasticsearch**     | 搜索与日志分析       | 快速检索、全文搜索        | 集群部署、索引优化             |
| **Jenkins**           | CI/CD工具       | 自动化构建、测试、部署      | 搭建流水线、自动化脚本           |
| **Prometheus/Zabbix** | 监控系统          | 采集与展示系统运行状态      | 配置监控项、告警策略            |


## Nginx
Nginx是一个高性能的 Web服务器 + 反向代理服务器，也常用作 负载均衡器、缓存服务器。
在运维岗位里，它的作用非常核心：
| 场景       | 说明                                 |
| -------- | ---------------------------------- |
| 静态网站服务器  | 用来托管 HTML、图片、视频等静态文件               |
| 反向代理     | 把用户请求转发给后端（比如Tomcat、Flask、Node.js） |
| 负载均衡     | 多台后端服务器分担请求压力                      |
| HTTPS 网关 | 负责 SSL/TLS 加密（安全访问）                |
| 缓存       | 减轻后端负载，加快响应速度                      |

# 工作模式
事件驱动模型是 Nginx 服务器实现完整功能并确保优异性能的核心机制之一。

事件驱动模型通常由事件收集器、事件发送器和事件处理器三大基本单元构成。其中，事件收集器负责捕获各类事件，包括用户交互事件（如鼠标点击、键盘输入）、硬件事件（如时钟中断）以及软件事件（如操作系统信号或应用内部通知）。事件发送器则将收集器获取的事件分发至相应的目标对象——即事件处理器所在的实体。事件处理器主要处理具体事件的响应逻辑，其实现细节往往需在开发阶段逐步完善。

# Nginx的工作流程
1. **用户请求过程**  
   当用户在浏览器中访问一个页面时，请求的流程如下：  
   - 浏览器向服务器发起 HTTP/HTTPS 请求；  
   - Nginx 接收该请求并进行解析；  
   - 根据配置文件中的规则（如 `server`、`location`、`proxy_pass`），决定是：  
     - 直接返回静态内容（如 HTML/CSS/JS）；  
     - 反向代理到后端应用服务器（如 Java、Python、Node.js 等）；  
   - 后端程序处理业务逻辑并返回结果；  
   - Nginx 将响应数据返回给用户。  

2. **常见后端应用服务**  
   - Java 应用：Tomcat、Spring Boot、Jetty  
   - Python 应用：uWSGI、Gunicorn、FastAPI  
   - Node.js 应用：Express、Koa  
   - PHP 应用：PHP-FPM 

## Nginx的配置解释

# Upstream 
Upstream定义的是上游服务器，当nginx收到请求后，有时候需要将请求反向代理给后端的服务
```
upstream thin {
    server 127.0.0.1:4566;
}
```
在这里,当收到请求就可以将其转发给本机的4566端口，通过ss命令来查看具体监听该端口的服务了

# Server
```
server {
    listen      [::]:443 default ipv6only=on;
    listen      172.16.20.27:443;
    listen      172.16.100.20:443;

    server_name localhost;
```
多地址监听，指明nginx该如何监听本机的哪些接口

# Location
```
    location / {
        add_header Cache-Control "max-age=15552000";
        add_header Cache-control "public";
        add_header Cache-control "only-if-cached";
        set $args "$args&__internal_tag__=web";
        try_files $uri $uri/ @fallback;
    }
```
在 Nginx 配置中，location 指令 就是用来匹配和处理用户请求的 URL 路径（URI）的“路由规则”。当用户（浏览器或客户端）访问一个 URL（如 https://example.com/url/xx.picture）时，Nginx 会根据请求的路径部分（这里是 /url/xx.picture）来查找匹配的 location 块，然后决定“计算机该如何工作”——比如，直接返回静态文件、代理到后端服务器、添加缓存头、重定向、或执行其他逻辑。

## log
```
    access_log /usr/local/appdata/normal/log/web.access.log user;
    error_log /usr/local/appdata/normal/log/web.error.log error;

    error_page 502 /static/502.html;
    error_page 504 /static/504.html;
```
定义日志的路径+格式