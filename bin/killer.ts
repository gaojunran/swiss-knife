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

    exec(command, (error, stdout, stderr) => {
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
          if (match && match[2]) {
            const pid = parseInt(match[2], 10);
            if (!isNaN(pid)) pids.push(pid);
          }
        }
      } else {
        // 解析 pgrep 的输出（每行一个 PID）
        stdout
          .trim()
          .split("\n")
          .forEach((line) => {
            const pid = parseInt(line, 10);
            if (!isNaN(pid)) pids.push(pid);
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

    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

// 示例用法
(async () => {
  try {
    const processName = "Wechat.exe"; // 替换成你的进程名
    const pids = await findPidByProcessName(processName);

    if (pids.length === 0) {
      console.log(`未找到进程 "${processName}"`);
      return;
    }

    console.log(`找到进程 "${processName}" 的 PID:`, pids);
    for (const pid of pids) {
      await killProcess(pid);
      console.log(`已终止 PID ${pid}`);
    }
  } catch (error) {
    console.error("出错:", error);
  }
})();
