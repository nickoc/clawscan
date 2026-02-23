import type { ScanRule, Finding, ParsedSkill } from "../types.js";
import { join } from "path";

function qualityFinding(
  ruleId: string,
  title: string,
  description: string,
  skillDir: string,
  evidence: string
): Finding {
  return {
    ruleId,
    severity: "info",
    title,
    description,
    location: { file: join(skillDir, "SKILL.md"), line: 1 },
    evidence,
  };
}

const QUAL_001: ScanRule = {
  id: "QUAL-001",
  severity: "info",
  title: "Missing skill description",
  description: "Skill has no description in frontmatter. Good skills should clearly describe their purpose.",
  scan(skill: ParsedSkill): Finding[] {
    if (!skill.skillMd.frontmatter.description) {
      return [qualityFinding(
        "QUAL-001",
        "Missing skill description",
        "No description found in SKILL.md frontmatter.",
        skill.dir,
        "description: (missing)"
      )];
    }
    return [];
  },
};

const QUAL_002: ScanRule = {
  id: "QUAL-002",
  severity: "info",
  title: "Missing version number",
  description: "Skill has no version in frontmatter. Versioning helps track changes and updates.",
  scan(skill: ParsedSkill): Finding[] {
    if (!skill.skillMd.frontmatter.version) {
      return [qualityFinding(
        "QUAL-002",
        "Missing version number",
        "No version found in SKILL.md frontmatter.",
        skill.dir,
        "version: (missing)"
      )];
    }
    return [];
  },
};

const QUAL_003: ScanRule = {
  id: "QUAL-003",
  severity: "low",
  title: "Overly broad permissions requested",
  description: "Skill requests very broad permissions that may not be necessary.",
  scan(skill: ParsedSkill): Finding[] {
    const perms = skill.skillMd.frontmatter.permissions;
    if (!Array.isArray(perms)) return [];

    const broadPerms = ["*", "all", "full-access", "root", "admin", "sudo"];
    const findings: Finding[] = [];

    for (const perm of perms) {
      if (typeof perm === "string" && broadPerms.includes(perm.toLowerCase())) {
        findings.push(qualityFinding(
          "QUAL-003",
          "Overly broad permissions requested",
          `Skill requests "${perm}" permission, which is overly broad.`,
          skill.dir,
          `permissions: ${perm}`
        ));
      }
    }
    return findings;
  },
};

const QUAL_004: ScanRule = {
  id: "QUAL-004",
  severity: "info",
  title: "Missing license information",
  description: "Skill has no license specified. Open skills should declare their license.",
  scan(skill: ParsedSkill): Finding[] {
    if (!skill.skillMd.frontmatter.license) {
      return [qualityFinding(
        "QUAL-004",
        "Missing license information",
        "No license found in SKILL.md frontmatter.",
        skill.dir,
        "license: (missing)"
      )];
    }
    return [];
  },
};

const QUAL_005: ScanRule = {
  id: "QUAL-005",
  severity: "info",
  title: "Missing author information",
  description: "Skill has no author specified. Attribution helps with trust assessment.",
  scan(skill: ParsedSkill): Finding[] {
    if (!skill.skillMd.frontmatter.author) {
      return [qualityFinding(
        "QUAL-005",
        "Missing author information",
        "No author found in SKILL.md frontmatter.",
        skill.dir,
        "author: (missing)"
      )];
    }
    return [];
  },
};

export const qualityRules: ScanRule[] = [QUAL_001, QUAL_002, QUAL_003, QUAL_004, QUAL_005];
