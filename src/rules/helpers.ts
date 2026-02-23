import type { Finding, ParsedSkill, Severity } from "../types.js";
import { getAllScannable, type ContentBlock } from "../parser/script-parser.js";
import { join } from "path";

export interface PatternMatch {
  file: string;
  line: number;
  match: string;
  column?: number;
}

export function searchAllContent(skill: ParsedSkill, pattern: RegExp): PatternMatch[] {
  const blocks = getAllScannable(
    skill.skillMd.codeBlocks,
    skill.scripts,
    skill.skillMd.body,
    join(skill.dir, "SKILL.md")
  );

  const matches: PatternMatch[] = [];

  for (const block of blocks) {
    const lines = block.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(pattern.source, pattern.flags.replace("g", ""));
      const m = regex.exec(line);
      if (m) {
        matches.push({
          file: block.file,
          line: block.lineOffset + i + 1,
          match: m[0],
          column: m.index + 1,
        });
      }
    }
  }

  return matches;
}

export function searchCodeContent(skill: ParsedSkill, pattern: RegExp): PatternMatch[] {
  const blocks = getAllScannable(
    skill.skillMd.codeBlocks,
    skill.scripts,
    "",
    join(skill.dir, "SKILL.md")
  );

  const codeBlocks = blocks.filter((b) => b.language !== "markdown");
  const matches: PatternMatch[] = [];

  for (const block of codeBlocks) {
    const lines = block.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(pattern.source, pattern.flags.replace("g", ""));
      const m = regex.exec(line);
      if (m) {
        matches.push({
          file: block.file,
          line: block.lineOffset + i + 1,
          match: m[0],
          column: m.index + 1,
        });
      }
    }
  }

  return matches;
}

export function createFinding(
  ruleId: string,
  severity: Severity,
  title: string,
  description: string,
  match: PatternMatch
): Finding {
  return {
    ruleId,
    severity,
    title,
    description,
    location: {
      file: match.file,
      line: match.line,
      column: match.column,
    },
    evidence: match.match,
  };
}

export function makeRule(
  id: string,
  severity: Severity,
  title: string,
  description: string,
  pattern: RegExp,
  searchFn: "all" | "code" = "all"
) {
  return {
    id,
    severity,
    title,
    description,
    scan(skill: ParsedSkill): Finding[] {
      const search = searchFn === "code" ? searchCodeContent : searchAllContent;
      const matches = search(skill, pattern);
      return matches.map((m) => createFinding(id, severity, title, description, m));
    },
  };
}
