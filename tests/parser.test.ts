import { describe, test, expect } from "bun:test";
import { parseFrontmatter, extractCodeBlocks, parseSkill } from "../src/parser/skill-parser";
import { getAllScannable } from "../src/parser/script-parser";
import { join } from "path";

const FIXTURES = join(import.meta.dir, "fixtures");

describe("parseFrontmatter", () => {
  test("extracts YAML frontmatter correctly", () => {
    const raw = `---
name: test-skill
description: A test skill
version: 1.0.0
author: tester
---

# Body content here`;

    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.name).toBe("test-skill");
    expect(frontmatter.description).toBe("A test skill");
    expect(frontmatter.version).toBe("1.0.0");
    expect(frontmatter.author).toBe("tester");
    expect(body).toContain("# Body content here");
  });

  test("handles missing frontmatter", () => {
    const raw = "# No frontmatter here\nJust content.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({});
    expect(body).toBe(raw);
  });

  test("handles empty frontmatter", () => {
    const raw = `---
---

# Content`;
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(body).toContain("# Content");
  });

  test("extracts array fields like triggers and permissions", () => {
    const raw = `---
name: test
triggers:
  - hello
  - help
permissions:
  - network
  - filesystem
---

Body`;

    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.triggers).toEqual(["hello", "help"]);
    expect(frontmatter.permissions).toEqual(["network", "filesystem"]);
  });
});

describe("extractCodeBlocks", () => {
  test("extracts code blocks with language tags", () => {
    const body = `Some text

\`\`\`bash
echo "hello"
\`\`\`

More text

\`\`\`python
print("world")
\`\`\``;

    const blocks = extractCodeBlocks(body);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].language).toBe("bash");
    expect(blocks[0].content).toBe('echo "hello"');
    expect(blocks[1].language).toBe("python");
    expect(blocks[1].content).toBe('print("world")');
  });

  test("handles code blocks without language tag", () => {
    const body = `\`\`\`
some code
\`\`\``;

    const blocks = extractCodeBlocks(body);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].language).toBe("unknown");
    expect(blocks[0].content).toBe("some code");
  });

  test("returns empty array for no code blocks", () => {
    const blocks = extractCodeBlocks("Just plain text, no code blocks.");
    expect(blocks).toHaveLength(0);
  });

  test("tracks line numbers correctly", () => {
    const body = `Line 0
Line 1
\`\`\`bash
echo "hello"
\`\`\``;

    const blocks = extractCodeBlocks(body);
    expect(blocks[0].line).toBe(3);
  });
});

describe("parseSkill", () => {
  test("parses clean skill fixture", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    expect(skill.skillMd.frontmatter.name).toBe("summarize-article");
    expect(skill.skillMd.frontmatter.version).toBe("1.0.0");
    expect(skill.skillMd.codeBlocks.length).toBeGreaterThan(0);
    expect(skill.scripts.length).toBeGreaterThan(0);
    expect(skill.scripts[0].filename).toBe("process.sh");
  });

  test("parses malicious skill fixture", async () => {
    const skill = await parseSkill(join(FIXTURES, "malicious-skill"));
    expect(skill.skillMd.frontmatter.name).toBe("super-helper-tool");
    expect(skill.skillMd.codeBlocks.length).toBeGreaterThanOrEqual(3);
    expect(skill.scripts.length).toBeGreaterThan(0);
  });

  test("throws for missing SKILL.md", async () => {
    expect(parseSkill("/tmp/nonexistent-skill")).rejects.toThrow("No SKILL.md found");
  });
});

describe("getAllScannable", () => {
  test("combines code blocks and scripts", async () => {
    const skill = await parseSkill(join(FIXTURES, "clean-skill"));
    const blocks = getAllScannable(
      skill.skillMd.codeBlocks,
      skill.scripts,
      skill.skillMd.body,
      join(skill.dir, "SKILL.md")
    );
    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks.some((b) => b.language === "markdown")).toBe(true);
    expect(blocks.some((b) => b.language === "bash")).toBe(true);
  });
});
