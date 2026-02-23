import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { searchAllContent, createFinding } from "./helpers.js";
import { join } from "path";

const SC_001: ScanRule = {
  id: "SC-001",
  severity: "medium",
  title: "Dependency confusion risk",
  description: "Skill references packages from non-standard or potentially malicious registries.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /--registry\s+https?:\/\/(?!registry\.npmjs\.org|pypi\.org|rubygems\.org)/,
      /pip\s+install\s+.*--index-url\s+https?:\/\/(?!pypi\.org)/,
      /npm\s+install\s+.*--registry\s+/,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "SC-001", "medium",
          "Dependency confusion risk",
          "Skill installs packages from a non-standard registry.",
          match
        ));
      }
    }
    return findings;
  },
};

const SC_002: ScanRule = {
  id: "SC-002",
  severity: "medium",
  title: "Typosquatting skill name risk",
  description: "Skill name closely resembles a popular skill, which could indicate typosquatting.",
  scan(skill: ParsedSkill): Finding[] {
    const name = skill.skillMd.frontmatter.name;
    if (!name) return [];

    const suspiciousPatterns = [
      /^(?:extract|create|analyze|summarize|write)[-_]?(?:wisdm|wisdon|wsidom)/i,
      /[-_](?:official|real|original|legit|genuine)$/i,
      /^[a-z]+-[a-z]+-[a-z]+-[a-z]+-[a-z]+$/,
    ];

    const findings: Finding[] = [];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        findings.push({
          ruleId: "SC-002",
          severity: "medium",
          title: "Typosquatting skill name risk",
          description: `Skill name "${name}" matches a pattern commonly used in typosquatting.`,
          location: { file: join(skill.dir, "SKILL.md"), line: 1 },
          evidence: name,
        });
      }
    }
    return findings;
  },
};

const SC_003: ScanRule = {
  id: "SC-003",
  severity: "low",
  title: "Unpinned dependency version",
  description: "Skill uses unpinned dependency versions, which could allow supply chain attacks via version hijacking.",
  scan(skill: ParsedSkill): Finding[] {
    const patterns = [
      /(?:npm|yarn|pnpm)\s+install\s+(?!.*@\d)[a-z@][\w\-/.]+(?:\s|$)/,
      /pip\s+install\s+(?!.*==\d)[a-z][\w\-.]+(?:\s|$)/,
      /gem\s+install\s+(?!.*-v\s+\d)[a-z][\w\-.]+(?:\s|$)/,
    ];

    const findings: Finding[] = [];
    for (const pattern of patterns) {
      const matches = searchAllContent(skill, pattern);
      for (const match of matches) {
        findings.push(createFinding(
          "SC-003", "low",
          "Unpinned dependency version",
          "Dependency installed without a pinned version, risking supply chain attacks.",
          match
        ));
      }
    }
    return findings;
  },
};

export const supplyChainRules: ScanRule[] = [SC_001, SC_002, SC_003];
