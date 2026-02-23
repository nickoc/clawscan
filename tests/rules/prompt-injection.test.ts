import { describe, test, expect } from "bun:test";
import { promptInjectionRules } from "../../src/rules/prompt-injection";
import { parseSkill } from "../../src/parser/skill-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Prompt Injection Rules", () => {
  test("detects system prompt override attempt", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = promptInjectionRules[0].scan(skill); // PI-001
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects jailbreak patterns", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = promptInjectionRules[1].scan(skill); // PI-002
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no prompt injection findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of promptInjectionRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});
