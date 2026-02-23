import type { Finding, Grade, Severity, ScanResult } from "./types.js";

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

export function calculateScore(findings: Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    score -= SEVERITY_PENALTY[finding.severity];
  }
  return Math.max(0, score);
}

export function getGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function summarizeFindings(findings: Finding[]): ScanResult["summary"] {
  const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: findings.length };
  for (const f of findings) {
    summary[f.severity]++;
  }
  return summary;
}

export function buildScanResult(skillName: string, findings: Finding[]): ScanResult {
  const score = calculateScore(findings);
  return {
    skill: skillName,
    findings,
    score,
    grade: getGrade(score),
    summary: summarizeFindings(findings),
  };
}
