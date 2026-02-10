---
title: 02_nginx
createTime: 2025/12/08 22:18:30
permalink: /notes/中间件/nginx/
---

## 1.Nginx的介绍
Nginx是一个高性能的 Web服务器 + 反向代理服务器，也常用作 负载均衡器、缓存服务器,
目前世界Web服务器的33%是由Nginx占据的。

值得一提的是,Nginx是由俄罗斯人开发出来的,作为开源项目被F5收购后，在俄乌战争中还发
了声明反击俄罗斯的声明。

在运维岗位里，它的作用非常核心：
| 场景       | 说明                                 |
| -------- | ---------------------------------- |
| 静态网站服务器  | 用来托管 HTML、图片、视频等静态文件               |
| 反向代理     | 把用户请求转发给后端（比如Tomcat、Flask、Node.js） |
| 负载均衡     | 为多台后端服务器分担请求压力                      |
| HTTPS 网关 | 负责 SSL/TLS 加密（安全访问）                |
| 缓存       | 减轻后端负载，加快响应速度                      |

# 工作模式
事件驱动模型是 Nginx 服务器的核心机制之一。

事件驱动模型通常由**事件收集器**、**事件发送器**和**事件处理器**三大基本单元构成。其中，事件收集器负责捕获各类事件，包括用户交互事件（如鼠标点击、键盘输入）、硬件事件（如时钟中断）以及软件事件（如操作系统信号或应用内部通知）。
事件发送器则将收集器获取的事件分发至相应的目标对象(中间件、后端服务器等等)。事件处理器就是主要处理具体事件的内容了。

# master、worker进程
当使用ss命令的时候，会发现此时的端口显示由nginx的master进程监听，可实际上**真正处理请求的是nginx的worker进程**
```
ss -tulnp|grep 80
```
从Linux内核的方面来解答的话，虽然监听 socket 是在 Nginx master 进程中创建的，
但在 fork worker 进程后，监听 socket 会被所有 worker 继承。客户端连接由内核分发到各个 worker，
worker 进程直接调用 accept 处理连接，master 进程不参与实际的数据收发，只负责进程管理和配置控制。

```可以使用如下方式来验证
1)ps -ef|grep nginx
2)strace -p 【worker的PID】 -e trace=network
3)浏览器发起http请求
```

# Nginx工作流程简述
1. **用户请求过程**  
   当用户在浏览器中访问一个页面时，请求的流程如下：  
   - 浏览器向服务器发起 HTTP/HTTPS 请求；  
   - Nginx 接收该请求并进行解析；  
   - 根据配置文件中的规则（如 `server`、`location`、`proxy_pass`），决定是：  
     - 直接返回静态内容（如 HTML/CSS/JS）；  
     - 反向代理到后端应用服务器（如 Java、Python、Node.js 等）；  
   - 后端程序处理业务逻辑并返回结果；  
   - Nginx 将响应数据返回给用户。  

上述工作流程也可以生动的展示出Nginx的主要作用:**"将用户的请求转发到合适的地方"**

## Nginx的conf文件解释

###  nginx.conf 和 *.conf的关系
*.conf是为了更加精细的说明实际的路由规则，而nginx.conf写的更像是兜底的内容。这也就像是写代码的时候，不会把所有的
逻辑判断都写一个py文件中，而是会把其封装好，引用就好了。

仔细观察Nginx在磁盘中的文件目录，会看到有一些配置放在
```
/etc/nginx/conf.d
```
这些配置文件会在nginx.conf的http块中进行集中加载
```
include /etc/nginx/conf.d/*.conf;
```
###  nginx -T
既然有nginx.conf和*.conf, 为了方便用户查看全部的配置，nginx提供了命令
```
nginx -T: Test and dump full configuration
nginx -t：只检查语法是否正确，不输出内容。
```
它会：先检查所有配置文件的语法是否正确（和 nginx -t 一样）。

如果语法 OK，就把 主配置文件（通常 /etc/nginx/nginx.conf） + 所有 include 进来的子配置文件 全部合并，输出成一个完整的配置文本。

这个输出的配置才是 Nginx 真正运行时使用的（不是你只看 nginx.conf 看到的那个）。

# Server
Server_name定义了HTTP请求应该发送到哪台机器上，而Nginx也就根据Server_name来实现流量的转发
```
server {
    listen 80;
    server_name 47.237.129.236;

    root /var/www/loc-test;
```
以上述内容来看,当用户在浏览器上输入http://47.237.129.236后,Nginx查看了Host头，就会将流量转发到对应的服务器
上进行判断。

# Location
Location块决定了,【当一个 HTTP 请求进来时：Nginx 如何判断 → 走哪个 location → 要不要代理 → 代理到哪个 upstream → 如何返回结果】

在 Nginx 配置中，location 指令 就是用来匹配和处理用户请求的 URL 路径的“路由规则”。

当用户访问一个 URL（如 https://example.com/url/xx.picture）时，Nginx 会根据请求的路径部分（这里是 /url/xx.picture）来查找匹配的 location 块，然后决定“计算机该如何工作”
比如: 直接返回静态文件、代理到后端服务器、添加缓存头、重定向、或执行其他逻辑。

## Location的匹配顺序

Location的匹配规则分为"前缀匹配"和"模式匹配", 学过数据结构的朋友就会很清楚，就是简单的字符串匹配算法。
对Nginx来说，方便人阅读的url，对它来说也只不过是一串没有任何含义的字符串，因此会严格遵循字符串的匹配规则。

```
Location的匹配规则是【location 是根据 URI 前缀 分流的】：
- 先找 =
- 再找 ^~
- 再跑正则（~ / ~*）
- 最后才用普通前缀
```

## 前缀匹配的示例
```nginx
location /api {
    return 200 "hello";   # A
}

location /api/ {
    return 200 "world";   # B
}

location ~ \.bp$ {
    return 200 "hi";      # C
}
```
1. 先进行前缀匹配
在所有“前缀 location”中，选择**匹配成功且 URI 最长（最具体）**的那一条

2. 再进行正则匹配
如果存在正则 location，会依次尝试

3. 只要有正则匹配成功，就会覆盖前缀匹配结果
如果没有任何正则匹配成功，则使用前缀匹配的结果

# Upstream 
Upstream定义的是上游服务器，当nginx收到请求后，很多情况下，都需要将HTTP请求反向代理给后端的服务，这个服务
可以是"一个进程、一组进程、甚至是不同机器上的服务"
```比如我可以先定义一个thin
upstream thin {
    server 127.0.0.1:4566;
}
```
在这里,当收到请求就可以将其转发给本机的4566端口，通过ss命令来查看具体监听该端口的服务了
```在Location中调用
Location /api/{
    proxy_pass http://thin;
}
```

通过在upstream里面写server,也可以看到nginx天生就可以事先负载均衡 [nginx的默认策略是轮询]
```upstream里面可以写多个server
upstream api_backend {
    server 127.0.0.1:4565;
    server 127.0.0.1:4566;
}
```

## Upstream的其他内容
* 健康状态检测
```
upstream api {
    server 127.0.0.1:4565 max_fails=3 fail_timeout=30s;
}
```
* Keepalive
```避免每次新建 TCP 连接
upstream api {
    server 127.0.0.1:4565;
    keepalive 32;
}
```


## log
```
    access_log /usr/local/appdata/normal/log/web.access.log user;
    error_log /usr/local/appdata/normal/log/web.error.log error;

    error_page 502 /static/502.html;
    error_page 504 /static/504.html;
```
定义日志的路径+格式