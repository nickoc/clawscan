import { describe, test, expect } from "bun:test";
import { credentialRules } from "../../src/rules/credential";
import { parseSkill } from "../../src/parser/skill-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Credential Rules", () => {
  test("detects hardcoded API keys in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = credentialRules[0].scan(skill); // CRED-001
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].ruleId).toBe("CRED-001");
  });

  test("detects env harvesting in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = credentialRules[1].scan(skill); // CRED-002
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].ruleId).toBe("CRED-002");
  });

  test("detects keychain access in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = credentialRules[2].scan(skill); // CRED-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects SSH key reading in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = credentialRules[3].scan(skill); // CRED-004
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no credential findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of credentialRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});
