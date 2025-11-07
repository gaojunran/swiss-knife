import { Command } from "@cliffy/command";
import * as path from "node:path";

/**
 * 在指定目录中执行命令
 * @param {string} dir 目录路径
 * @param {string} command 要执行的命令
 * @returns {Promise<void>}
 */
async function executeInDirectory(dir: string, command: string): Promise<void> {
  const absolutePath = path.resolve(dir);

  // 检查目录是否存在
  try {
    const stat = await Deno.stat(absolutePath);
    if (!stat.isDirectory) {
      throw new Error(`"${dir}" 不是一个目录`);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(`目录 "${dir}" 不存在`);
    }
    throw err;
  }

  console.log(`\n📂 在目录 "${dir}" 中执行: mise exec -- ${command}`);
  console.log("─".repeat(60));

  // 使用 Deno.Command 执行命令
  const cmd = new Deno.Command("mise", {
    args: ["exec", "--", ...command.split(" ")],
    cwd: absolutePath,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const process = cmd.spawn();
  const status = await process.status;

  if (!status.success) {
    throw new Error(`命令在目录 "${dir}" 中执行失败，退出码: ${status.code}`);
  }

  console.log(`✅ 在 "${dir}" 中执行成功`);
}

// 导出 Cliffy Command
export const eachCommand = new Command()
  .name("each")
  .description("Execute a command in multiple directories using mise exec")
  .useRawArgs()
  .arguments("<args...:string>")
  .action(async (_options, ...args: string[]) => {
    if (args.length === 0) {
      console.error("用法: each <dir1> [dir2] [dir3] ... -- <command>");
      Deno.exit(2);
    }

    // 找到 -- 分隔符的位置
    const separatorIndex = args.indexOf("--");

    if (separatorIndex === -1) {
      console.error('错误: 缺少 "--" 分隔符');
      console.error("用法: each <dir1> [dir2] [dir3] ... -- <command>");
      Deno.exit(2);
    }

    if (separatorIndex === 0) {
      console.error("错误: 至少需要指定一个目录");
      console.error("用法: each <dir1> [dir2] [dir3] ... -- <command>");
      Deno.exit(2);
    }

    if (separatorIndex === args.length - 1) {
      console.error('错误: "--" 后面必须指定要执行的命令');
      console.error("用法: each <dir1> [dir2] [dir3] ... -- <command>");
      Deno.exit(2);
    }

    // 分离目录列表和命令
    const directories = args.slice(0, separatorIndex);
    const command = args.slice(separatorIndex + 1).join(" ");

    console.log(`🚀 将在 ${directories.length} 个目录中执行命令`);
    console.log(`📋 命令: mise exec -- ${command}`);
    console.log(`📁 目录: ${directories.join(", ")}`);

    let successCount = 0;
    let failureCount = 0;

    // 依次在每个目录中执行命令
    for (const dir of directories) {
      try {
        await executeInDirectory(dir, command);
        successCount++;
      } catch (err) {
        console.error(`❌ 错误: ${err.message}`);
        failureCount++;
      }
    }

    // 输出总结
    console.log("\n" + "=".repeat(60));
    console.log(`📊 执行完成: ${successCount} 成功, ${failureCount} 失败`);

    if (failureCount > 0) {
      Deno.exit(1);
    }
  });

// 直接运行支持
if (import.meta.main) {
  await eachCommand.parse(Deno.args);
}
