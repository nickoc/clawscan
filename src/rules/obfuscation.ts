import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { searchAllContent, searchCodeContent, createFinding } from "./helpers.js";

const OBF_001: ScanRule = {
  id: "OBF-001",
  severity: "high",
  title: "Base64-encoded command execution",
  description: "Skill decodes and executes base64-encoded content, a common obfuscation technique.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /echo\s+.*\|\s*base64\s+-d\s*\|\s*(?:ba)?sh/,
      /base64\s+-d.*\|\s*(?:ba)?sh/,
      /atob\(.*\).*(?:eval|exec|Function)/s,
      /Buffer\.from\(.*,\s*["']base64["']\).*(?:eval|exec)/s,
      /b64decode\(.*\).*(?:exec|eval|subprocess)/s,
      /\bpowershell\b.*-[eE](?:nc(?:oded)?[cC]ommand)?\s+[A-Za-z0-9+/=]{20,}/,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "OBF-001", "high",
          "Base64-encoded command execution",
          "Detected base64 decoding followed by command execution.",
          match
        ));
      }
    }
    return findings;
  },
};

const OBF_002: ScanRule = {
  id: "OBF-002",
  severity: "medium",
  title: "Hex-encoded or escaped strings",
  description: "Skill contains suspicious hex-encoded strings that may hide malicious content.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /\\x[0-9a-fA-F]{2}(?:\\x[0-9a-fA-F]{2}){7,}/,
      /(?:0x[0-9a-fA-F]{2},?\s*){8,}/,
      /String\.fromCharCode\(\s*(?:\d+,\s*){5,}/,
      /chr\(\s*\d+\s*\)\s*\.\s*(?:chr\(\s*\d+\s*\)\s*\.\s*){5,}/,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchCodeContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "OBF-002", "medium",
          "Hex-encoded or escaped strings",
          "Found long hex-encoded or escaped strings that may hide malicious content.",
          match
        ));
      }
    }
    return findings;
  },
};

const OBF_003: ScanRule = {
  id: "OBF-003",
  severity: "high",
  title: "Dynamic code execution via eval or exec",
  description: "Skill uses eval, exec, or Function constructor to execute dynamically constructed code.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /\beval\s*\(/,
      /\bexec\s*\(/,
      /new\s+Function\s*\(/,
      /\bcompile\s*\(.*\)\s*\(\)/,
      /child_process.*exec/,
      /subprocess\.(?:call|run|Popen)\s*\(/,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchCodeContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "OBF-003", "high",
          "Dynamic code execution via eval or exec",
          "Skill executes dynamically constructed code, which may hide malicious behavior.",
          match
        ));
      }
    }
    return findings;
  },
};

export const obfuscationRules: ScanRule[] = [OBF_001, OBF_002, OBF_003];
