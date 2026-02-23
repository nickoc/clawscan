import { describe, test, expect } from "bun:test";
import { calculateScore, getGrade, summarizeFindings, buildScanResult } from "../src/scorer";
import type { Finding } from "../src/types";

function makeFinding(severity: Finding["severity"]): Finding {
  return {
    ruleId: "TEST-001",
    severity,
    title: "Test finding",
    description: "Test",
    location: { file: "test.md", line: 1 },
    evidence: "test",
  };
}

describe("calculateScore", () => {
  test("returns 100 for no findings", () => {
    expect(calculateScore([])).toBe(100);
  });

  test("subtracts 25 for critical", () => {
    expect(calculateScore([makeFinding("critical")])).toBe(75);
  });

  test("subtracts 15 for high", () => {
    expect(calculateScore([makeFinding("high")])).toBe(85);
  });

  test("subtracts 8 for medium", () => {
    expect(calculateScore([makeFinding("medium")])).toBe(92);
  });

  test("subtracts 3 for low", () => {
    expect(calculateScore([makeFinding("low")])).toBe(97);
  });

  test("subtracts 0 for info", () => {
    expect(calculateScore([makeFinding("info")])).toBe(100);
  });

  test("clamps to 0 minimum", () => {
    const findings = Array(10).fill(null).map(() => makeFinding("critical"));
    expect(calculateScore(findings)).toBe(0);
  });

  test("accumulates multiple findings", () => {
    const findings = [makeFinding("critical"), makeFinding("high"), makeFinding("medium")];
    expect(calculateScore(findings)).toBe(100 - 25 - 15 - 8);
  });
});

describe("getGrade", () => {
  test("A for 90-100", () => {
    expect(getGrade(100)).toBe("A");
    expect(getGrade(90)).toBe("A");
  });

  test("B for 75-89", () => {
    expect(getGrade(89)).toBe("B");
    expect(getGrade(75)).toBe("B");
  });

  test("C for 60-74", () => {
    expect(getGrade(74)).toBe("C");
    expect(getGrade(60)).toBe("C");
  });

  test("D for 40-59", () => {
    expect(getGrade(59)).toBe("D");
    expect(getGrade(40)).toBe("D");
  });

  test("F for 0-39", () => {
    expect(getGrade(39)).toBe("F");
    expect(getGrade(0)).toBe("F");
  });
});

describe("summarizeFindings", () => {
  test("counts by severity", () => {
    const findings = [
      makeFinding("critical"),
      makeFinding("critical"),
      makeFinding("high"),
      makeFinding("medium"),
      makeFinding("info"),
    ];
    const summary = summarizeFindings(findings);
    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
    expect(summary.low).toBe(0);
    expect(summary.info).toBe(1);
    expect(summary.total).toBe(5);
  });
});

describe("buildScanResult", () => {
  test("builds complete scan result", () => {
    const findings = [makeFinding("critical"), makeFinding("high")];
    const result = buildScanResult("test-skill", findings);
    expect(result.skill).toBe("test-skill");
    expect(result.findings).toHaveLength(2);
    expect(result.score).toBe(60);
    expect(result.grade).toBe("C");
    expect(result.summary.total).toBe(2);
  });
});
