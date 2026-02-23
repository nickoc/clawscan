import { describe, test, expect } from "bun:test";
import { obfuscationRules } from "../../src/rules/obfuscation";
import { parseSkill } from "../../src/parser/skill-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Obfuscation Rules", () => {
  test("detects base64-encoded command execution", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = obfuscationRules[0].scan(skill); // OBF-001
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects eval/exec usage", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = obfuscationRules[2].scan(skill); // OBF-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no obfuscation findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of obfuscationRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});
