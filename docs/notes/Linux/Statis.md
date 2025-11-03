---
title: Linux 运维命令自检清单
createTime: 2025/09/23 18:11:55
permalink: /notes/Linux/tcdyy8ti/
---
# Linux 运维命令自检清单 ✅

> 使用说明：
> - [ ] 表示未掌握
> - [x] 表示已掌握
> - 你可以边复习边打勾，也可以写备注（比如 "熟练" / "需复习"）
---

## 1. 基础文件与目录操作
- [✔] ls -l / ls -lh
- [✔] pwd
- [✔] cd
- [✔] mkdir -p
- [✔] rm -rf
- [✔] cp -r
- [✔] mv
- [✔] find /path -name "*.log"
- [ ] du -sh *
- [✔] df -h

---

## 2. 文本与日志处理
- [✔] cat / tac
- [✔] less
- [✔] head -n 20
- [✔] tail -f file.log
- [✔] grep "error" file.log
- [✔] awk '{print $1,$3}' file
- [ ] sed -n '5,10p' file
- [ ] wc -l file

---

## 3. 用户与权限管理
- [✔] whoami
- [ ] id
- [✔] adduser / useradd
- [✔] passwd
- [ ] usermod -aG sudo user
- [✔] chmod 755 file
- [ ] chown user:group file
- [ ] groups user

---

## 4. 进程与系统状态
- [✔] ps aux | grep nginx
- [✔] top / htop
- [✔] kill -9 pid
- [ ] uptime
- [✔] free -m
- [ ] vmstat 1
- [ ] dmesg | tail

---

## 5. 网络相关命令
- [✔] ping 8.8.8.8
- [✔] curl -I https://www.baidu.com
- [ ] wget url
- [✔] telnet ip port
- [ ] nc -zv ip port
- [✔] ss -lntp / netstat -tulnp
- [✔] ip addr / ifconfig
- [✔] ip route / route -n
- [✔] traceroute ip
- [✔] dig www.baidu.com / nslookup www.baidu.com
- [✔] arp -a

---

## 6. 服务管理（systemd）
- [✔] systemctl status sshd
- [✔] systemctl start nginx
- [✔] systemctl stop nginx
- [✔] systemctl restart nginx
- [✔] systemctl enable nginx
- [ ] journalctl -xe

---

## 7. 软件管理
- [✔] apt update && apt upgrade
- [✔] apt install pkg / apt remove pkg
- [✔] yum install pkg / yum remove pkg
- [✔] dnf update

---

## 8. 压缩与打包
- [✔] tar -zxvf file.tar.gz
- [✔] tar -zcvf file.tar.gz dir/
- [✔] zip -r file.zip dir/
- [✔] unzip file.zip

---

## 9. 磁盘与文件系统
- [✔] lsblk
- [ ] mount /dev/sdb1 /mnt
- [ ] umount /mnt
- [✔] df -Th
- [ ] fsck /dev/sdb1

---

## 10. 安全相关
- [✔] ssh user@host
- [✔] scp file user@host:/path/
- [ ] rsync -avz src/ user@host:/dst/
- [✔] iptables -L
- [ ] ufw status / firewall-cmd --list-all

---

## 11. 脚本与调试
- [✔] bash script.sh
- [✔] chmod +x script.sh
- [✔] ./script.sh arg1 arg2
- [✔] set -x
- [✔] echo $?

