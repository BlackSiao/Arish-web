
source /etc/network/interfaces.d/*

auto lo
iface lo inet loopback

auto bond0
iface bond0 inet static
    address 66.51.74.23/24
    gateway 66.51.74.1
    dns-nameservers 8.8.8.8
    bond-mode 802.3ad
    bond-miimon 100
    bond-lacp-rate fast
    bond-xmit-hash-policy layer3+4
    bond-slaves ens1f0np0 ens1f1np1

auto ens1f0np0
iface ens1f0np0 inet manual
    bond-master bond0

auto ens1f1np1
iface ens1f1np1 inet manual
    bond-master bond0
