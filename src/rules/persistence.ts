import type { ScanRule } from "../types.js";
import { makeRule } from "./helpers.js";

const PERS_001 = makeRule(
  "PERS-001",
  "high",
  "Cron job creation or modification",
  "Skill creates or modifies cron jobs, which could establish persistent execution.",
  /(?:crontab\s|\/etc\/cron\.|\/var\/spool\/cron|schtasks\s+\/create)/i
);

const PERS_002 = makeRule(
  "PERS-002",
  "high",
  "Startup item or launch agent registration",
  "Skill registers items to run at system startup.",
  /(?:LaunchAgents|LaunchDaemons|\.plist|launchctl\s+(?:load|bootstrap)|Startup\s*Items|autostart|\.desktop.*autostart)/i
);

const PERS_003 = makeRule(
  "PERS-003",
  "high",
  "Shell profile or RC file modification",
  "Skill modifies shell startup files, which could inject commands into every shell session.",
  /(?:>>?\s*~?\/?\.(?:bash_profile|bashrc|zshrc|profile|zprofile|zshenv|bash_login|zlogin)|echo\s+.*>>.*rc\b)/i,
  "code"
);

export const persistenceRules: ScanRule[] = [PERS_001, PERS_002, PERS_003];
