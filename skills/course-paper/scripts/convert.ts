#!/usr/bin/env node
/**
 * 实验报告模板转换脚本
 * 用法: node convert.ts <input.docx|input.md>
 * 输出: JSON { ok, data: { markdown, name } }
 */
import fs from "node:fs";
import path from "node:path";

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("用法: node convert.ts <input.docx|input.md>");
    process.exit(1);
  }

  const ext = path.extname(input).toLowerCase();

  // Markdown: 直接读取
  if (ext === ".md") {
    const text = fs.readFileSync(input, "utf-8");
    console.log(JSON.stringify({ ok: true, data: { markdown: text, name: path.basename(input) } }));
    return;
  }

  // DOCX: mammoth 转换
  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const buffer = fs.readFileSync(input);
    const result = await mammoth.convertToMarkdown({ buffer });
    const name = path.basename(input).replace(/\.docx$/i, ".md");
    console.log(JSON.stringify({ ok: true, data: { markdown: result.value, name } }));
    return;
  }

  console.log(JSON.stringify({ ok: false, error: `不支持的格式: ${ext}` }));
  process.exit(1);
}

main();
