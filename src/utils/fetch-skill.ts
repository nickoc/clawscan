import { mkdtemp, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

interface ClawHubFile {
  name: string;
  content: string;
  path: string;
}

export async function fetchSkillFromUrl(url: string): Promise<string> {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (pathParts.length < 2 || pathParts[0] !== "skills") {
    throw new Error(`Invalid ClawHub URL format. Expected: https://clawhub.net/skills/<skill-name>`);
  }

  const skillName = pathParts[1];

  const rawBase = `${parsed.origin}/api/skills/${skillName}`;

  const tmpDir = await mkdtemp(join(tmpdir(), "clawscan-"));
  const skillDir = join(tmpDir, skillName);
  await mkdir(skillDir, { recursive: true });

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
}

export function isClawHubUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.hostname.includes("clawhub") || url.pathname.startsWith("/skills/");
  } catch {
    return false;
  }
}
