import type { ScriptFile, CodeBlock } from "../types.js";

export interface ContentBlock {
  content: string;
  file: string;
  language: string;
  lineOffset: number;
}

export function getAllScannable(
  codeBlocks: CodeBlock[],
  scripts: ScriptFile[],
  skillMdBody: string,
  skillMdFile: string
): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  blocks.push({
    content: skillMdBody,
    file: skillMdFile,
    language: "markdown",
    lineOffset: 0,
  });

  for (const block of codeBlocks) {
    blocks.push({
      content: block.content,
      file: skillMdFile,
      language: block.language,
      lineOffset: block.line,
    });
  }

  for (const script of scripts) {
    blocks.push({
      content: script.content,
      file: script.path,
      language: script.language,
      lineOffset: 0,
    });
  }

  return blocks;
}
