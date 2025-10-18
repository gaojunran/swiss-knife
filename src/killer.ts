#!/usr/bin/env bun

import { exec } from "child_process";
import os from "os";

/**
 * 查找进程名对应的 PID
 * @param {string} processName 进程名（Windows 可以是部分名称）
 * @returns {Promise<number[]>} 返回 PID 数组
 */
function findPidByProcessName(processName: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command: string;

    if (platform === "win32") {
      // Windows: tasklist 命令
      command = `tasklist /FI "IMAGENAME eq ${processName}*" /FO CSV`;
    } else {
      // Linux/macOS: 使用 pgrep（如果没有 pgrep，可以用 ps aux + grep）
      command = `pgrep -f "${processName}"`;
    }

    exec(command, (error, stdout) => {
      if (error) {
        // 如果 pgrep 找不到进程，会返回 code 1，不算错误
        if (platform !== "win32" && error.code === 1) {
          return resolve([]);
        }
        return reject(error);
      }

      const pids: number[] = [];
      if (platform === "win32") {
        // 解析 Windows 的 tasklist CSV 输出
        const lines = stdout.trim().split("\n").slice(1); // 去掉标题行
        for (const line of lines) {
          const match = line.match(/"([^"]+)","([^"]+)","([^"]+)"/);
          if (match?.[2]) {
            const pid = parseInt(match[2], 10);
            if (!Number.isNaN(pid)) pids.push(pid);
          }
        }
      } else {
        // 解析 pgrep 的输出（每行一个 PID）
        stdout
          .trim()
          .split("\n")
          .forEach((line) => {
            const pid = parseInt(line, 10);
            if (!Number.isNaN(pid)) pids.push(pid);
          });
      }

      resolve(pids);
    });
  });
}

/**
 * 终止进程
 * @param {number} pid 进程 ID
 * @returns {Promise<void>}
 */
function killProcess(pid: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    const command =
      platform === "win32"
        ? `taskkill /PID ${pid} /F`
        : `kill -9 ${pid}`;

    exec(command, (error, _stdout, _stderr) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

// CLI: 支持多个参数，参数可以是进程名或 PID（数字）
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("用法: killer <processName|pid> [<processName|pid> ...]");
    process.exitCode = 2;
    return;
  }

  for (const arg of args) {
    try {
      // 如果 arg 是纯数字，直接当作 PID 处理
      if (/^\d+$/.test(arg)) {
        const pid = Number(arg);
        console.log(`终止指定 PID ${pid} ...`);
        await killProcess(pid);
        console.log(`已终止 PID ${pid}`);
        continue;
      }

      // 否则按进程名查找（可能返回多个 PID）
      const pids = await findPidByProcessName(arg);
      if (pids.length === 0) {
        console.warn(`未找到进程 "${arg}"`);
        continue;
      }

      console.log(`找到进程 "${arg}" 的 PID:`, pids);
      for (const pid of pids) {
        try {
          await killProcess(pid);
          console.log(`已终止 PID ${pid}`);
        } catch (e) {
          console.error(`无法终止 PID ${pid}:`, e);
        }
      }
    } catch (err) {
      console.error(`处理 "${arg}" 时出错:`, err);
    }
  }
}

// 直接运行
// use import.meta.main which works in ESM environments (bun/node when using ESM)
if ((import.meta).main) {
  main().catch((e) => {
    console.error("出错:", e);
    process.exit(1);
  });
}
