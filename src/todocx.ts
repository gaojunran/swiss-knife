import { Command } from "@cliffy/command";
import clipboard from "npm:clipboardy";
import open from "npm:open";
import path from "node:path";
import { $ } from "jsr:@david/dax";

// 生成随机文件名后缀
function randomId(length: number = 6): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
    return await Deno.readTextFile(inputFile);
  } else {
    const clipboardContent = clipboard.readSync();
    if (!clipboardContent) {
      throw new Error("Clipboard is empty and no input file provided.");
    }
    return clipboardContent;
  }
}

// 导出 Cliffy Command
export const todocxCommand = new Command()
  .name("todocx")
  .description("Convert Markdown to Word document using Pandoc")
  .arguments("[inputFile:string]")
  .option("-o, --output <output:string>", "Output file name")
  .action(async (options, inputFile?: string) => {
    const outputFile = options.output ?? `output-${randomId()}.docx`;

    // 检查是否安装了 Pandoc
    if (!(await isPandocInstalled())) {
      console.error("Pandoc is not installed. Please install Pandoc first.");
      Deno.exit(1);
    }

    try {
      const markdownText = await getInputContent(inputFile);

      // 将 Markdown 内容保存到临时文件
      const tempInputFile = `temp-${randomId()}.md`;
      await Deno.writeTextFile(tempInputFile, markdownText);

      // 调用 Pandoc 进行转换
      await $`pandoc ${tempInputFile} -o ${outputFile}`;

      // 删除临时文件
      await Deno.remove(tempInputFile);

      console.log(`Word file generated: ${outputFile}`);
      await open(path.resolve(outputFile));
    } catch (err) {
      console.error("Error processing markdown:", err);
      Deno.exit(1);
    }
  });

// 直接运行支持
if (import.meta.main) {
  await todocxCommand.parse(Deno.args);
}
