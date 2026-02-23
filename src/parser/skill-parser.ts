import { parse as parseYaml } from "yaml";
import { readdir, readFile, stat } from "fs/promises";
import { join, extname, basename } from "path";
import type { ParsedSkill, SkillFrontmatter, CodeBlock, ScriptFile } from "../types.js";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
const CODE_BLOCK_RE = /^```(\w*)\n([\s\S]*?)^```/gm;

export function parseFrontmatter(raw: string): { frontmatter: SkillFrontmatter; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const yamlStr = match[1];
  const body = raw.slice(match[0].length).trim();

  let frontmatter: SkillFrontmatter;
  try {
    const parsed = parseYaml(yamlStr, { maxAliasCount: 100 });
    frontmatter = typeof parsed === "object" && parsed !== null ? (parsed as SkillFrontmatter) : {};
  } catch {
    frontmatter = {};
  }

  return { frontmatter, body };
}

export function extractCodeBlocks(body: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = body.split("\n");

  let inBlock = false;
  let currentLang = "";
  let currentContent: string[] = [];
  let blockStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inBlock && line.startsWith("```")) {
      inBlock = true;
      currentLang = line.slice(3).trim();
      currentContent = [];
      blockStartLine = i + 1;
    } else if (inBlock && line.startsWith("```")) {
      blocks.push({
        language: currentLang || "unknown",
        content: currentContent.join("\n"),
        line: blockStartLine,
      });
      inBlock = false;
      currentLang = "";
      currentContent = [];
    } else if (inBlock) {
      currentContent.push(line);
    }
  }

  return blocks;
}

function detectLanguage(filename: string): string {
  const ext = extname(filename).toLowerCase();
  const langMap: Record<string, string> = {
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".rb": "ruby",
    ".pl": "perl",
    ".ps1": "powershell",
    ".bat": "batch",
    ".cmd": "batch",
  };
  return langMap[ext] || "unknown";
}

async function readDirSafe(dirPath: string): Promise<string[]> {
  try {
    const entries = await readdir(dirPath);
    return entries;
  } catch {
    return [];
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function parseScripts(scriptsDir: string): Promise<ScriptFile[]> {
  const files = await readDirSafe(scriptsDir);
  const scripts: ScriptFile[] = [];

  for (const file of files) {
    const filePath = join(scriptsDir, file);
    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat || !fileStat.isFile()) continue;

    const content = await readFile(filePath, "utf-8");
    scripts.push({
      path: filePath,
      filename: file,
      content,
      language: detectLanguage(file),
    });
  }

  return scripts;
}

export async function parseSkill(dir: string): Promise<ParsedSkill> {
  const skillMdPath = join(dir, "SKILL.md");
  const hasSkillMd = await fileExists(skillMdPath);

  if (!hasSkillMd) {
    throw new Error(`No SKILL.md found in ${dir}`);
  }

  const raw = await readFile(skillMdPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(raw);
  const codeBlocks = extractCodeBlocks(body);

  const scripts = await parseScripts(join(dir, "scripts"));
  const references = await readDirSafe(join(dir, "references"));
  const assets = await readDirSafe(join(dir, "assets"));

  return {
    dir,
    skillMd: { raw, frontmatter, body, codeBlocks },
    scripts,
    references,
    assets,
  };
}
