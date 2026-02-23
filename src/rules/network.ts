import type { ScanRule } from "../types.js";
import { makeRule } from "./helpers.js";

const NET_001 = makeRule(
  "NET-001",
  "medium",
  "Unusual port binding or listening",
  "Skill binds to a network port, which could expose services or create backdoors.",
  /(?:\.listen\(\d+|nc\s+-l|ncat\s+-l|socat\s+TCP-LISTEN|bind\(.*\d{2,5}|server\.listen|createServer)/i
);

const NET_002 = makeRule(
  "NET-002",
  "high",
  "Proxy configuration or setup",
  "Skill configures a network proxy, which could intercept traffic.",
  /(?:http_proxy|https_proxy|ALL_PROXY|no_proxy|SOCKS_PROXY|proxy_pass|mitmproxy|charles|fiddler)\s*=/i
);

const NET_003 = makeRule(
  "NET-003",
  "high",
  "DNS configuration modification",
  "Skill modifies DNS settings, which could redirect network traffic.",
  /(?:\/etc\/resolv\.conf|networksetup.*-setdnsservers|\/etc\/hosts\b|dns\s+server|Set-DnsClientServerAddress)/i,
  "code"
);

const NET_004 = makeRule(
  "NET-004",
  "critical",
  "Network traffic interception or sniffing",
  "Skill uses packet capture or traffic interception tools.",
  /(?:tcpdump|wireshark|tshark|pcap|packet[_-]?capture|promiscuous|AF_PACKET|raw\s+socket|scapy)/i
);

export const networkRules: ScanRule[] = [NET_001, NET_002, NET_003, NET_004];
