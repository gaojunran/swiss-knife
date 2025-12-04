import { Command } from "@cliffy/command";
import sharp from "npm:sharp";
import clipboard from "npm:clipboardy";
import { existsSync } from "https://deno.land/std@0.208.0/fs/mod.ts";

async function convertToPng(
  input: string | Buffer,
  width?: number,
  height?: number,
): Promise<Buffer> {
  let sharpInstance = sharp(input);

  // 如果指定了尺寸，进行调整
  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: sharp.fit.contain,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  return await sharpInstance.png().toBuffer();
}

// 导出 Cliffy Command
export const toPngCommand = new Command()
  .name("topng")
  .description("Convert SVG/JPG/PNG to PNG with optional resizing")
  .option("-w, --width <width:number>", "Output image width")
  .option("-h, --height <height:number>", "Output image height")
  .option(
    "-i, --input <input:string>",
    "Input file path (if not provided, reads from clipboard)",
  )
  .option(
    "-o, --output <output:string>",
    "Output file path (if not provided, outputs to clipboard)",
  )
  .action(async (options) => {
    let inputData: string | Buffer;

    // 获取输入数据
    if (options.input) {
      if (!existsSync(options.input)) {
        console.error(`File not found: ${options.input}`);
        Deno.exit(1);
      }
      inputData = await Deno.readFile(options.input);
    } else {
      const clipboardContent = clipboard.readSync();
      if (!clipboardContent) {
        console.error("Clipboard is empty and no input file provided");
        Deno.exit(1);
      }

      // 检查是否是 data URL
      if (clipboardContent.startsWith("data:image/")) {
        const base64Data = clipboardContent.split(",")[1];
        inputData = Buffer.from(base64Data, "base64");
      } else {
        inputData = clipboardContent;
      }
    }

    try {
      const pngBuffer = await convertToPng(
        inputData,
        options.width,
        options.height,
      );

      // 输出结果
      if (options.output) {
        await Deno.writeFile(options.output, pngBuffer);
        console.log(`✓ PNG saved to ${options.output}`);

        if (options.width || options.height) {
          console.log(
            `  Size: ${options.width || "auto"} x ${options.height || "auto"}`,
          );
        }
      } else {
        // 转换为 data URL 并复制到剪贴板
        const base64Data = pngBuffer.toString("base64");
        const dataURL = `data:image/png;base64,${base64Data}`;

        clipboard.writeSync(dataURL);
        console.log("✓ PNG data URL copied to clipboard!");

        if (options.width || options.height) {
          console.log(
            `  Size: ${options.width || "auto"} x ${options.height || "auto"}`,
          );
        }
      }
    } catch (err) {
      console.error("Error converting image:", err);
      Deno.exit(1);
    }
  });

// 直接运行支持
if (import.meta.main) {
  await toPngCommand.parse(Deno.args);
}
