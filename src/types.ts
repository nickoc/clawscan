export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  license?: string;
  triggers?: string[];
  permissions?: string[];
  dependencies?: string[];
  [key: string]: unknown;
}

export interface CodeBlock {
  language: string;
  content: string;
  line: number;
}

export interface ScriptFile {
  path: string;
  filename: string;
  content: string;
  language: string;
}

export interface ParsedSkill {
  dir: string;
  skillMd: {
    raw: string;
    frontmatter: SkillFrontmatter;
    body: string;
    codeBlocks: CodeBlock[];
  };
  scripts: ScriptFile[];
  references: string[];
  assets: string[];
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  title: string;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  evidence: string;
}

export interface ScanRule {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  scan(skill: ParsedSkill): Finding[];
}

export interface ScanResult {
  skill: string;
  findings: Finding[];
  score: number;
  grade: Grade;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
}

export interface ScanOptions {
  format: "json" | "table" | "sarif";
  minSeverity?: Severity;
  ci?: boolean;
  failOn?: Severity;
}
