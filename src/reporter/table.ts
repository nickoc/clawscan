import chalk from "chalk";
import Table from "cli-table3";
import type { ScanResult, Severity } from "../types.js";

const SEVERITY_COLORS: Record<Severity, (s: string) => string> = {
  critical: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.blue,
  info: chalk.gray,
};

const GRADE_COLORS: Record<string, (s: string) => string> = {
  A: chalk.green.bold,
  B: chalk.green,
  C: chalk.yellow,
  D: chalk.red,
  F: chalk.red.bold,
};

export function formatTable(result: ScanResult): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(chalk.bold(`  ClawScan Report: ${result.skill}`));
  lines.push("");

  const gradeColor = GRADE_COLORS[result.grade] || chalk.white;
  lines.push(`  Trust Score: ${gradeColor(`${result.score}/100 (${result.grade})`)}`);
  lines.push("");

  if (result.findings.length === 0) {
    lines.push(chalk.green("  No security findings detected."));
    lines.push("");
    return lines.join("\n");
  }

  const summaryParts: string[] = [];
  if (result.summary.critical > 0) summaryParts.push(chalk.red.bold(`${result.summary.critical} critical`));
  if (result.summary.high > 0) summaryParts.push(chalk.red(`${result.summary.high} high`));
  if (result.summary.medium > 0) summaryParts.push(chalk.yellow(`${result.summary.medium} medium`));
  if (result.summary.low > 0) summaryParts.push(chalk.blue(`${result.summary.low} low`));
  if (result.summary.info > 0) summaryParts.push(chalk.gray(`${result.summary.info} info`));
  lines.push(`  Findings: ${summaryParts.join(", ")} (${result.summary.total} total)`);
  lines.push("");

  const table = new Table({
    head: ["Severity", "Rule", "Title", "Location", "Evidence"],
    colWidths: [12, 12, 30, 30, 40],
    wordWrap: true,
    style: { head: ["cyan"] },
  });

  for (const f of result.findings) {
    const sevColor = SEVERITY_COLORS[f.severity];
    const location = f.location.column
      ? `${f.location.file}:${f.location.line}:${f.location.column}`
      : `${f.location.file}:${f.location.line}`;

    table.push([
      sevColor(f.severity.toUpperCase()),
      f.ruleId,
      f.title,
      location,
      f.evidence.slice(0, 80),
    ]);
  }

  lines.push(table.toString());
  lines.push("");

  return lines.join("\n");
}

export function formatTableBatch(results: ScanResult[]): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(chalk.bold("  ClawScan Batch Report"));
  lines.push(chalk.gray(`  Scanned ${results.length} skills`));
  lines.push("");

  const table = new Table({
    head: ["Skill", "Score", "Grade", "Critical", "High", "Medium", "Low", "Info"],
    style: { head: ["cyan"] },
  });

  for (const r of results) {
    const gradeColor = GRADE_COLORS[r.grade] || chalk.white;
    table.push([
      r.skill,
      r.score.toString(),
      gradeColor(r.grade),
      r.summary.critical > 0 ? chalk.red.bold(r.summary.critical.toString()) : "0",
      r.summary.high > 0 ? chalk.red(r.summary.high.toString()) : "0",
      r.summary.medium > 0 ? chalk.yellow(r.summary.medium.toString()) : "0",
      r.summary.low > 0 ? chalk.blue(r.summary.low.toString()) : "0",
      r.summary.info.toString(),
    ]);
  }

  lines.push(table.toString());
  lines.push("");

  return lines.join("\n");
}
