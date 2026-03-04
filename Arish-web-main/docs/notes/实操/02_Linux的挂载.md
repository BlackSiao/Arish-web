---
title: 02_Linux的挂载
createTime: 2026/01/27 16:09:00
permalink: /notes/实操/f1n4r56w/
---

# 如何知道某一个文件夹被什么挂载了？
```
mount | grep "xx"
```
 
```例子
tiger@VNHCM-FPT-00:/var/www/html/one/jsos$ mount | grep jsos
/var/www/html/one/JSOS_100-64251018.iso on /var/www/html/one/jsos type iso9660 (ro,relatime,nojoliet,check=s,map=n,blocksize=2048,iocharset=utf8)
```

# 如何取消挂载呢？
只要 没有进程在用它，随时可以卸。

```
sudo umount /var/www/html/one/jsos
```
如果提示
```说明有进程在用
target is busy
```