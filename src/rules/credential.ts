import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { makeRule, searchAllContent, createFinding } from "./helpers.js";

const CRED_001 = makeRule(
  "CRED-001",
  "critical",
  "Hardcoded API key or secret",
  "Found what appears to be a hardcoded API key, secret token, or password in the skill code.",
  /(?:api[_-]?key|api[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token|password)\s*[:=]\s*["'][A-Za-z0-9+/=_\-]{16,}["']/i
);

const CRED_002: ScanRule = {
  id: "CRED-002",
  severity: "critical",
  title: "Environment variable harvesting",
  description: "Skill attempts to read multiple environment variables or dump the entire environment, which could expose credentials.",
  scan(skill: ParsedSkill): Finding[] {
    const envDumpPatterns = [
      /process\.env(?!\[|\.(?:NODE_ENV|HOME|PATH|SHELL|USER|TERM))/i,
      /\$ENV\b/,
      /os\.environ(?!\.get\(["'](?:HOME|PATH|SHELL|USER|TERM)["']\))/,
      /printenv|env\s*\|/,
      /Object\.keys\(process\.env\)/,
      /JSON\.stringify\(process\.env\)/,
    ];

    const findings: Finding[] = [];
    for (const pattern of envDumpPatterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "CRED-002", "critical",
          "Environment variable harvesting",
          "Skill attempts to read or dump environment variables that may contain credentials.",
          match
        ));
      }
    }
    return findings;
  },
};

const CRED_003 = makeRule(
  "CRED-003",
  "critical",
  "Keychain or credential store access",
  "Skill attempts to access the system keychain, credential manager, or password store.",
  /security\s+find-(?:generic|internet)-password|credential\s*manager|keyring|kwallet|secret-tool|pass\s+show/i
);

const CRED_004 = makeRule(
  "CRED-004",
  "high",
  "SSH key file access",
  "Skill attempts to read SSH private keys or known_hosts files.",
  /[~$](?:HOME)?\/?\.(ssh\/(?:id_rsa|id_ed25519|id_ecdsa|id_dsa|config|known_hosts|authorized_keys))|cat\s+.*\.ssh\//i
);

const CRED_005 = makeRule(
  "CRED-005",
  "high",
  "Dotenv or config file access",
  "Skill reads .env files or common configuration files that may contain secrets.",
  /(?:cat|read|source|\.)\s+.*\.env(?:\.local|\.production|\.development)?(?:\s|$|["'])|dotenv\.config|load_dotenv/i,
  "code"
);

const CRED_006 = makeRule(
  "CRED-006",
  "high",
  "Credentials in URL",
  "Found credentials embedded directly in a URL string.",
  /(?:https?|ftp):\/\/[^:\s]+:[^@\s]+@[^\s]+/i
);

export const credentialRules: ScanRule[] = [
  CRED_001, CRED_002, CRED_003, CRED_004, CRED_005, CRED_006,
];
