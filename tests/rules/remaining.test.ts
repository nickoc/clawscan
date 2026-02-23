import { describe, test, expect } from "bun:test";
import { supplyChainRules } from "../../src/rules/supply-chain";
import { privacyRules } from "../../src/rules/privacy";
import { persistenceRules } from "../../src/rules/persistence";
import { networkRules } from "../../src/rules/network";
import { qualityRules } from "../../src/rules/quality";
import { parseSkill } from "../../src/parser/skill-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "..", "fixtures");

describe("Supply Chain Rules", () => {
  test("all three rules exist", () => {
    expect(supplyChainRules).toHaveLength(3);
    expect(supplyChainRules[0].id).toBe("SC-001");
    expect(supplyChainRules[1].id).toBe("SC-002");
    expect(supplyChainRules[2].id).toBe("SC-003");
  });

  test("clean skill has no supply chain findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of supplyChainRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});

describe("Privacy Rules", () => {
  test("all three rules exist", () => {
    expect(privacyRules).toHaveLength(3);
    expect(privacyRules[0].id).toBe("PRIV-001");
    expect(privacyRules[1].id).toBe("PRIV-002");
    expect(privacyRules[2].id).toBe("PRIV-003");
  });

  test("detects browser history access in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = privacyRules[2].scan(skill); // PRIV-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no privacy findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of privacyRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});

describe("Persistence Rules", () => {
  test("all three rules exist", () => {
    expect(persistenceRules).toHaveLength(3);
    expect(persistenceRules[0].id).toBe("PERS-001");
    expect(persistenceRules[1].id).toBe("PERS-002");
    expect(persistenceRules[2].id).toBe("PERS-003");
  });

  test("detects cron job creation in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = persistenceRules[0].scan(skill); // PERS-001
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects launch agent registration in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = persistenceRules[1].scan(skill); // PERS-002
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects shell profile modification in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = persistenceRules[2].scan(skill); // PERS-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no persistence findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of persistenceRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});

describe("Network Rules", () => {
  test("all four rules exist", () => {
    expect(networkRules).toHaveLength(4);
    expect(networkRules[0].id).toBe("NET-001");
    expect(networkRules[1].id).toBe("NET-002");
    expect(networkRules[2].id).toBe("NET-003");
    expect(networkRules[3].id).toBe("NET-004");
  });

  test("detects traffic interception in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = networkRules[3].scan(skill); // NET-004
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects proxy setup in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = networkRules[1].scan(skill); // NET-002
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects DNS modification in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = networkRules[2].scan(skill); // NET-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("clean skill has no network findings", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    for (const rule of networkRules) {
      const findings = rule.scan(skill);
      expect(findings).toHaveLength(0);
    }
  });
});

describe("Quality Rules", () => {
  test("all five rules exist", () => {
    expect(qualityRules).toHaveLength(5);
    expect(qualityRules[0].id).toBe("QUAL-001");
    expect(qualityRules[4].id).toBe("QUAL-005");
  });

  test("clean skill passes quality checks (has all metadata)", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    const descFindings = qualityRules[0].scan(skill); // QUAL-001
    expect(descFindings).toHaveLength(0);
    const versionFindings = qualityRules[1].scan(skill); // QUAL-002
    expect(versionFindings).toHaveLength(0);
    const licenseFindings = qualityRules[3].scan(skill); // QUAL-004
    expect(licenseFindings).toHaveLength(0);
    const authorFindings = qualityRules[4].scan(skill); // QUAL-005
    expect(authorFindings).toHaveLength(0);
  });

  test("detects overly broad permissions in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = qualityRules[2].scan(skill); // QUAL-003
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects missing license in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = qualityRules[3].scan(skill); // QUAL-004
    expect(findings.length).toBeGreaterThan(0);
  });

  test("detects missing author in malicious skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    const findings = qualityRules[4].scan(skill); // QUAL-005
    expect(findings.length).toBeGreaterThan(0);
  });
});
