import type { ScanRule, Finding, ParsedSkill, Severity } from "../types.js";
import { credentialRules } from "./credential.js";
import { malwareRules } from "./malware.js";
import { exfiltrationRules } from "./exfiltration.js";
import { promptInjectionRules } from "./prompt-injection.js";
import { supplyChainRules } from "./supply-chain.js";
import { privacyRules } from "./privacy.js";
import { persistenceRules } from "./persistence.js";
import { networkRules } from "./network.js";
import { obfuscationRules } from "./obfuscation.js";
import { qualityRules } from "./quality.js";

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function getAllRules(): ScanRule[] {
  return [
    ...credentialRules,
    ...malwareRules,
    ...exfiltrationRules,
    ...promptInjectionRules,
    ...supplyChainRules,
    ...privacyRules,
    ...persistenceRules,
    ...networkRules,
    ...obfuscationRules,
    ...qualityRules,
  ];
}

export function runRules(skill: ParsedSkill, minSeverity?: Severity): Finding[] {
  const rules = getAllRules();
  const findings: Finding[] = [];

  for (const rule of rules) {
    const ruleFindings = rule.scan(skill);
    findings.push(...ruleFindings);
  }

  const filtered = minSeverity
    ? findings.filter((f) => SEVERITY_ORDER[f.severity] <= SEVERITY_ORDER[minSeverity])
    : findings;

  return filtered.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
