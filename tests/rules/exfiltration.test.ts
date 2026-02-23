import { describe, test, expect } from "bun:test";
import { exfiltrationRules } from "../../src/rules/exfiltration";
import { parseSkill } from "../../src/parser/skill-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Exfiltration Rules", () => {
  test("detects data exfil to external URL", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = exfiltrationRules[0].scan(skill); // EXFIL-001
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects DNS exfiltration", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = exfiltrationRules[1].scan(skill); // EXFIL-002
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects clipboard monitoring", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = exfiltrationRules[2].scan(skill); // EXFIL-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects file upload", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = exfiltrationRules[3].scan(skill); // EXFIL-004
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no exfiltration findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of exfiltrationRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});
