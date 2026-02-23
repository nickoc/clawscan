import { readdir, stat } from "fs/promises";
import { join } from "path";

export async function findSkillDirs(baseDir: string): Promise<string[]> {
  const dirs: string[] = [];
  const entries = await readdir(baseDir);

  for (const entry of entries) {
    const fullPath = join(baseDir, entry);
    const entryStat = await stat(fullPath).catch(() => null);
    if (!entryStat || !entryStat.isDirectory()) continue;

    const skillMdPath = join(fullPath, "SKILL.md");
    const hasSkillMd = await stat(skillMdPath).then(() => true).catch(() => false);

    if (hasSkillMd) {
      dirs.push(fullPath);
    }
  }

  return dirs;
}
