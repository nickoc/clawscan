import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { searchAllContent, createFinding } from "./helpers.js";

const PI_001: ScanRule = {
  id: "PI-001",
  severity: "high",
  title: "System prompt override attempt",
  description: "Skill contains patterns that attempt to override or replace the system prompt of an AI assistant.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
      /forget\s+(?:all\s+)?(?:previous|prior|your)\s+instructions/i,
      /you\s+are\s+now\s+(?:a|an)\s+/i,
      /new\s+system\s+prompt/i,
      /override\s+system\s+(?:prompt|message|instruction)/i,
      /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|rules|guidelines)/i,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "PI-001", "high",
          "System prompt override attempt",
          "Found text attempting to override AI system instructions.",
          match
        ));
      }
    }
    return findings;
  },
};

const PI_002: ScanRule = {
  id: "PI-002",
  severity: "high",
  title: "Jailbreak pattern detected",
  description: "Skill contains known jailbreak patterns designed to bypass AI safety measures.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /DAN\s+mode|do\s+anything\s+now/i,
      /jailbreak|jail\s+break/i,
      /developer\s+mode\s+enabled/i,
      /act\s+as\s+(?:an?\s+)?(?:unrestricted|unfiltered|uncensored)/i,
      /pretend\s+(?:you\s+(?:are|have)\s+)?no\s+(?:restrictions|limitations|rules)/i,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "PI-002", "high",
          "Jailbreak pattern detected",
          "Found known jailbreak pattern designed to bypass AI safety measures.",
          match
        ));
      }
    }
    return findings;
  },
};

const PI_003: ScanRule = {
  id: "PI-003",
  severity: "medium",
  title: "Instruction injection in data fields",
  description: "Skill embeds instructions or prompts in data fields that could manipulate AI behavior.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /<!--\s*(?:system|instruction|prompt):/i,
      /\[INST\]/i,
      /\[\/INST\]/i,
      /<\|(?:system|im_start|im_end)\|>/i,
      /\{\{#system\}\}/i,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "PI-003", "medium",
          "Instruction injection in data fields",
          "Found embedded instructions in data fields that could manipulate AI behavior.",
          match
        ));
      }
    }
    return findings;
  },
};

export const promptInjectionRules: ScanRule[] = [PI_001, PI_002, PI_003];
