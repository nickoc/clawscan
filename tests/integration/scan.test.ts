import { describe, test, expect } from "bun:test";
import { parseSkill } from "../../src/parser/skill-parser";
import { runRules, getAllRules } from "../../src/rules/index";
import { buildScanResult } from "../../src/scorer";
import { formatJson } from "../../src/reporter/json";
import { formatTable } from "../../src/reporter/table";
import { formatSarif } from "../../src/reporter/sarif";
import { findSkillDirs } from "../../src/utils/walk-dir";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Integration: Rule Engine", () => {
  test("loads all 39 rules", () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(39);
  });

  test("all rules have valid structure", () => {
    const rules = getAllRules();
    for (const rule of rules) {
      expect(rule.id).toMatch(/^[A-Z]+-\d{3}$/);
      expect(rule.severity).toMatch(/^(critical|high|medium|low|info)$/);
      expect(rule.title.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(typeof rule.scan).toBe("function");
    }
  });
});

describe("Integration: Full Scan - Clean Skill", () => {
  test("clean skill scores 90+ with no critical findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    const findings = runRules(skill);
    const result = buildScanResult("clean-skill", findings);

    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.summary.critical).toBe(0);
    expect(result.grade).toBe("A");
  });
});

describe("Integration: Full Scan - Malicious Skill", () => {
  test("malicious skill scores below 40 with critical findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = runRules(skill);
    const result = buildScanResult("malicious-skill", findings);

    expect(result.score).toBeLessThan(40);
    expect(result.summary.critical).toBeGreaterThan(0);
    expect(result.grade).toBe("F");
  });

  test("malicious skill triggers multiple rule categories", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = runRules(skill);

    const categories = new Set(findings.map((f) => f.ruleId.split("-")[0]));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});

describe("Integration: Reporters", () => {
  test("JSON reporter outputs valid JSON", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = runRules(skill);
    const result = buildScanResult("malicious-skill", findings);
    const json = formatJson(result);

    const parsed = JSON.parse(json);
    expect(parsed.skill).toBe("malicious-skill");
    expect(parsed.findings).toBeInstanceOf(Array);
    expect(parsed.score).toBeNumber();
    expect(parsed.grade).toBeString();
    expect(parsed.summary).toBeDefined();
  });

  test("table reporter produces non-empty output", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = runRules(skill);
    const result = buildScanResult("malicious-skill", findings);
    const table = formatTable(result);

    expect(table.length).toBeGreaterThan(0);
    expect(table).toContain("ClawScan Report");
    expect(table).toContain("Trust Score");
  });

  test("SARIF reporter outputs valid SARIF 2.1.0", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = runRules(skill);
    const result = buildScanResult("malicious-skill", findings);
    const sarif = formatSarif(result);

    const parsed = JSON.parse(sarif);
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs).toBeInstanceOf(Array);
    expect(parsed.runs[0].tool.driver.name).toBe("clawscan");
    expect(parsed.runs[0].results).toBeInstanceOf(Array);
    expect(parsed.runs[0].results.length).toBeGreaterThan(0);
  });
});

describe("Integration: Severity Filter", () => {
  test("filters findings by minimum severity", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const allFindings = runRules(skill);
    const highOnly = runRules(skill, "high");

    expect(highOnly.length).toBeLessThanOrEqual(allFindings.length);
    for (const f of highOnly) {
      expect(["critical", "high"]).toContain(f.severity);
    }
  });
});

describe("Integration: Batch Scan", () => {
  test("finds skill dirs in fixtures directory", async () => {
    const dirs = await findSkillDirs(FIXTURES);
    expect(dirs.length).toBeGreaterThanOrEqual(2);
  });
});
