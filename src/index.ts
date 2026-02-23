#!/usr/bin/env bun
import { Command } from "commander";
import { parseSkill } from "./parser/skill-parser.js";
import { runRules } from "./rules/index.js";
import { buildScanResult } from "./scorer.js";
import { formatJson, formatJsonBatch } from "./reporter/json.js";
import { formatTable, formatTableBatch } from "./reporter/table.js";
import { formatSarif, formatSarifBatch } from "./reporter/sarif.js";
import { findSkillDirs } from "./utils/walk-dir.js";
import { fetchSkillFromUrl, isClawHubUrl } from "./utils/fetch-skill.js";
import { basename } from "path";
import type { Severity, ScanResult, ScanOptions } from "./types.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function formatOutput(result: ScanResult, format: string): string {
  switch (format) {
    case "json": return formatJson(result);
    case "sarif": return formatSarif(result);
    case "table":
    default: return formatTable(result);
  }
}

function formatBatchOutput(results: ScanResult[], format: string): string {
  switch (format) {
    case "json": return formatJsonBatch(results);
    case "sarif": return formatSarifBatch(results);
    case "table":
    default: return formatTableBatch(results);
  }
}

async function scanSingleSkill(
  path: string,
  options: { format: string; minSeverity?: string; ci?: boolean; failOn?: string }
): Promise<{ result: ScanResult; exitCode: number }> {
  let skillDir = path;

  if (isClawHubUrl(path)) {
    console.error(`Fetching skill from ${path}...`);
    skillDir = await fetchSkillFromUrl(path);
  }

  const skill = await parseSkill(skillDir);
  const findings = runRules(skill, options.minSeverity as Severity | undefined);
  const skillName = skill.skillMd.frontmatter.name || basename(skillDir);
  const result = buildScanResult(skillName, findings);

  let exitCode = 0;
  if (options.ci && options.failOn) {
    const threshold = SEVERITY_ORDER[options.failOn as Severity];
    const hasViolation = findings.some((f) => SEVERITY_ORDER[f.severity] <= threshold);
    if (hasViolation) exitCode = 1;
  }

  return { result, exitCode };
}

const program = new Command();

program
  .name("clawscan")
  .description("Security scanner for OpenClaw/ClawHub skills")
  .version("0.1.0");

program
  .command("scan", { isDefault: true })
  .description("Scan a skill directory or ClawHub URL")
  .argument("<path>", "Path to skill directory or ClawHub URL")
  .option("-f, --format <format>", "Output format (json, table, sarif)", "table")
  .option("--min-severity <severity>", "Minimum severity to report")
  .option("--ci", "CI mode — exit with code 1 on findings above threshold")
  .option("--fail-on <severity>", "Severity threshold for CI failure (used with --ci)")
  .action(async (path: string, options: Record<string, string | boolean | undefined>) => {
    try {
      const { result, exitCode } = await scanSingleSkill(path, {
        format: (options.format as string) || "table",
        minSeverity: options.minSeverity as string | undefined,
        ci: options.ci as boolean | undefined,
        failOn: options.failOn as string | undefined,
      });
      console.log(formatOutput(result, (options.format as string) || "table"));
      process.exit(exitCode);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }
  });

program
  .command("batch")
  .description("Scan all skills in a directory")
  .argument("<dir>", "Directory containing skill subdirectories")
  .option("-f, --format <format>", "Output format (json, table, sarif)", "table")
  .option("--min-severity <severity>", "Minimum severity to report")
  .option("--ci", "CI mode — exit with code 1 on findings above threshold")
  .option("--fail-on <severity>", "Severity threshold for CI failure (used with --ci)")
  .action(async (dir: string, options: Record<string, string | boolean | undefined>) => {
    try {
      const skillDirs = await findSkillDirs(dir);
      if (skillDirs.length === 0) {
        console.error(`No skills found in ${dir}`);
        process.exit(2);
      }

      const results: ScanResult[] = [];
      let maxExitCode = 0;

      for (const skillDir of skillDirs) {
        const { result, exitCode } = await scanSingleSkill(skillDir, {
          format: (options.format as string) || "table",
          minSeverity: options.minSeverity as string | undefined,
          ci: options.ci as boolean | undefined,
          failOn: options.failOn as string | undefined,
        });
        results.push(result);
        if (exitCode > maxExitCode) maxExitCode = exitCode;
      }

      console.log(formatBatchOutput(results, (options.format as string) || "table"));
      process.exit(maxExitCode);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(2);
    }
  });

program.parse();
