import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { makeRule, searchAllContent, createFinding } from "./helpers.js";

const EXFIL_001: ScanRule = {
  id: "EXFIL-001",
  severity: "critical",
  title: "Data exfiltration to external URL",
  description: "Skill sends local data to an external URL, which could exfiltrate sensitive information.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /curl\s+.*-(?:d|X\s*POST|--data)\s+.*(?:\$|`|cat\s|@)/,
      /\|\s*curl\s+.*-(?:d|X\s*POST|--data)/,
      /wget\s+--post-(?:data|file)/,
      /fetch\(.*method:\s*["']POST["'].*body:/s,
      /requests\.post\(/,
      /http\.request.*method.*POST/s,
      /XMLHttpRequest.*send\(/s,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "EXFIL-001", "critical",
          "Data exfiltration to external URL",
          "Skill sends data to an external endpoint, potentially exfiltrating sensitive information.",
          match
        ));
      }
    }
    return findings;
  },
};

const EXFIL_002 = makeRule(
  "EXFIL-002",
  "high",
  "DNS-based data exfiltration",
  "Skill uses DNS queries to exfiltrate data, a common covert channel technique.",
  /(?:dig|nslookup|host)\s+.*\$|dns.*tunnel|iodine\s|dnscat/i
);

const EXFIL_003 = makeRule(
  "EXFIL-003",
  "high",
  "Clipboard monitoring or access",
  "Skill monitors or reads clipboard contents, which could capture sensitive copied data.",
  /(?:pbpaste|xclip|xsel|clip\.exe|powershell.*clipboard|pyperclip|clipboard\.read)/i
);

const EXFIL_004: ScanRule = {
  id: "EXFIL-004",
  severity: "high",
  title: "File upload to unknown host",
  description: "Skill uploads files to an external server.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /curl\s+.*-F\s+["']?file=/,
      /curl\s+.*--upload-file/,
      /scp\s+.*@.*:/,
      /rsync\s+.*@.*:/,
      /sftp\s+/,
      /FormData.*append.*file/s,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "EXFIL-004", "high",
          "File upload to unknown host",
          "Skill uploads files to an external server, which could exfiltrate data.",
          match
        ));
      }
    }
    return findings;
  },
};

export const exfiltrationRules: ScanRule[] = [
  EXFIL_001, EXFIL_002, EXFIL_003, EXFIL_004,
];
