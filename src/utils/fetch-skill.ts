import { mkdtemp, writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

interface ClawHubFile {
  name: string;
  content: string;
  path: string;
}

const ALLOWED_HOSTNAMES = [
  "clawhub.net",
  "www.clawhub.net",
  "clawhub.ai",
  "www.clawhub.ai",
  "clawhub.com",
  "www.clawhub.com",
];

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.includes(hostname.toLowerCase());
}

export async function fetchSkillFromUrl(url: string): Promise<string> {
  const parsed = new URL(url);

  if (!isAllowedHost(parsed.hostname)) {
    throw new Error(
      `Blocked: ${parsed.hostname} is not a recognized ClawHub host. Allowed: ${ALLOWED_HOSTNAMES.join(", ")}`
    );
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Blocked: only http/https protocols are allowed, got ${parsed.protocol}`);
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (pathParts.length < 2 || pathParts[0] !== "skills") {
    throw new Error(`Invalid ClawHub URL format. Expected: https://clawhub.net/skills/<skill-name>`);
  }

  const skillName = pathParts[1];

  // Sanitize skill name — alphanumeric, hyphens, underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
    throw new Error(`Invalid skill name: ${skillName}. Only alphanumeric, hyphens, and underscores allowed.`);
  }

  const rawBase = `${parsed.origin}/api/skills/${skillName}`;

  const tmpDir = await mkdtemp(join(tmpdir(), "clawscan-"));
  const skillDir = join(tmpDir, skillName);
  await mkdir(skillDir, { recursive: true });

  try {
    const skillMdUrl = `${rawBase}/SKILL.md`;
    const response = await fetch(skillMdUrl);

    if (!response.ok) {
      const altUrl = `${parsed.origin}/skills/${skillName}/raw/SKILL.md`;
      const altResponse = await fetch(altUrl);
      if (!altResponse.ok) {
        throw new Error(
          `Failed to fetch skill from ClawHub. Tried:\n  ${skillMdUrl} (${response.status})\n  ${altUrl} (${altResponse.status})\n\nThe skill may not exist or ClawHub API may have changed.`
        );
      }
      const content = await altResponse.text();
      await writeFile(join(skillDir, "SKILL.md"), content);
    } else {
      const content = await response.text();
      await writeFile(join(skillDir, "SKILL.md"), content);
    }

    try {
      const scriptsUrl = `${rawBase}/scripts`;
      const scriptsResponse = await fetch(scriptsUrl);
      if (scriptsResponse.ok) {
        const scriptsData = await scriptsResponse.json() as ClawHubFile[];
        if (Array.isArray(scriptsData)) {
          await mkdir(join(skillDir, "scripts"), { recursive: true });
          for (const file of scriptsData) {
            // Sanitize script filenames
            if (!/^[a-zA-Z0-9_.-]+$/.test(file.name)) continue;
            const fileResponse = await fetch(`${rawBase}/scripts/${file.name}`);
            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              await writeFile(join(skillDir, "scripts", file.name), fileContent);
            }
          }
        }
      }
    } catch {
      // Scripts directory may not exist — that's fine
    }

    return skillDir;
  } catch (err) {
    // Clean up temp dir on failure
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    throw err;
  }
}

export function isClawHubUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return isAllowedHost(url.hostname);
  } catch {
    return false;
  }
}
