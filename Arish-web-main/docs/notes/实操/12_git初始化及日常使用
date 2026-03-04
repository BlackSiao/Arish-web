## 写该文档的原因
说来也比较搞笑，直到现在我都没有在Github上进行过任何项目的合作，绝大部分时候我就只要Clone，Commit，Pull一下就好了，
后来接入了VSCode后，又基本上去用图形化界面了，对于Git的内容我还真是忘干净了,现在重新记录一下

## Git的初始化配置

1. 安装好Git后，首先要做的就是配置自己的用户名和邮箱地址，这些信息会被记录在每次提交的历史中，方便其他人识别提交者的身份。
```
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

git remote add origin(这个是给对应远程仓库取的别名，可以随便改的) <远程仓库的URL>
```

2. 验证本机到远程仓库的连接
``` 连接远程仓库
git remote -v
```
这一步也可以通过直接git clone来解决，在clone的时候成功就算是已经可以正常连接到远程仓库了

```修改远程仓库的地址
git remote set-url origin <新的远程仓库URL>
```

3. 在本机生成SSH密钥对，并将公钥添加到远程仓库的账户设置中，以便进行安全的身份验证。
```生成SSH密钥对
ssh-keygen -t ed25519 -C "你的邮箱@example.com"
# 如果系统不支持ed25519算法，可以使用RSA算法
ssh-keygen -t rsa -b 4096 -C "你的邮箱@example.com"
```

生成的密钥对通常会保存在用户主目录下的`.ssh`文件夹
```查看刚刚生成的公钥
cat ~/.ssh/id_ed25519.pub
# 或者
cat ~/.ssh/id_rsa.pub
```

4. 把刚刚生成的公钥复制到Github的个人设置中的SSH和GPG密钥部分，点击“New SSH key”，粘贴公钥并保存。

5. 测试SSH连接
```测试SSH连接
ssh -T git@github.com  
# 如果成功，你会看到一条欢迎消息，说明你已经成功连接到GitHub了


6. 假设在办公室也要偷偷更新文档，就需要先将自己本地的项目更新到和远端一样最新的地方
```
git pull origin(刚刚设置的远程仓库别名) main
```