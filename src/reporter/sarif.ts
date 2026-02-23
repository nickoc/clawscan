import type { ScanResult, Finding, Severity } from "../types.js";
import { getAllRules } from "../rules/index.js";

interface SarifLevel {
  [key: string]: string;
}

const SEVERITY_TO_SARIF_LEVEL: Record<Severity, string> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
  info: "note",
};

function buildRuleDescriptors() {
  const rules = getAllRules();
  return rules.map((r) => ({
    id: r.id,
    name: r.title.replace(/\s+/g, ""),
    shortDescription: { text: r.title },
    fullDescription: { text: r.description },
    defaultConfiguration: {
      level: SEVERITY_TO_SARIF_LEVEL[r.severity],
    },
    properties: {
      severity: r.severity,
    },
  }));
}

function buildResult(finding: Finding) {
  return {
    ruleId: finding.ruleId,
    level: SEVERITY_TO_SARIF_LEVEL[finding.severity],
    message: { text: finding.description },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: finding.location.file },
          region: {
            startLine: finding.location.line,
            startColumn: finding.location.column || 1,
          },
        },
      },
    ],
    properties: {
      severity: finding.severity,
      evidence: finding.evidence,
    },
  };
}

export function formatSarif(result: ScanResult): string {
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "clawscan",
            version: "0.1.0",
            informationUri: "https://github.com/clawscan/clawscan",
            rules: buildRuleDescriptors(),
          },
        },
        results: result.findings.map(buildResult),
        properties: {
          trustScore: result.score,
          grade: result.grade,
          summary: result.summary,
        },
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

export function formatSarifBatch(results: ScanResult[]): string {
  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: results.map((result) => ({
      tool: {
        driver: {
          name: "clawscan",
          version: "0.1.0",
          informationUri: "https://github.com/clawscan/clawscan",
          rules: buildRuleDescriptors(),
        },
      },
      results: result.findings.map(buildResult),
      properties: {
        skill: result.skill,
        trustScore: result.score,
        grade: result.grade,
        summary: result.summary,
      },
    })),
  };

  return JSON.stringify(sarif, null, 2);
}
