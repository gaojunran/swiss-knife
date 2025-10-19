#!/usr/bin/env bun

import clipboard from "clipboardy";
import open from "open";
import path from "node:path";
import { $ } from "bun";

// 生成随机文件名后缀
function randomId(length: number = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// 检查系统中是否安装了 Pandoc
async function isPandocInstalled(): Promise<boolean> {
  try {
    await $`pandoc --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

// 获取输入的 Markdown 内容
async function getInputContent(inputFile?: string): Promise<string> {
  if (inputFile) {
    return await $`cat ${inputFile}`.text();
  } else {
    const clipboardContent = clipboard.readSync();
    if (!clipboardContent) {
      throw new Error("Clipboard is empty and no input file provided.");
    }
    return clipboardContent;
  }
}

async function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] ?? `output-${randomId()}.docx`;

  // 检查是否安装了 Pandoc
  if (!(await isPandocInstalled())) {
    console.error("Pandoc is not installed. Please install Pandoc first.");
    process.exit(1);
  }

  try {
    const markdownText = await getInputContent(inputFile);

    // 将 Markdown 内容保存到临时文件
    const tempInputFile = path.join(__dirname, `temp-${randomId()}.md`);
    await $`echo ${markdownText} > ${tempInputFile}`;

    // 调用 Pandoc 进行转换
    await $`pandoc ${tempInputFile} -o ${outputFile}`;

    console.log(`Word file generated: ${outputFile}`);
    open(path.resolve(outputFile));
  } catch (err) {
    console.error("Error processing markdown:", err);
    process.exit(1);
  }
}

main();
