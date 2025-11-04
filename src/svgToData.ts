import { Command } from "@cliffy/command";
import sharp from "npm:sharp";
import clipboard from "npm:clipboardy";

async function svgToDataURL(
  svgString: string,
  width: number = 100,
  height: number = 100,
): Promise<string> {
  const buffer = await sharp(Buffer.from(svgString))
    .resize(width, height, { fit: sharp.fit.contain })
    .png()
    .toBuffer();

  const base64Data = buffer.toString("base64");
  return `data:image/png;base64,${base64Data}`;
}

// 导出 Cliffy Command
export const svgToDataCommand = new Command()
  .name("svg2data")
  .description("Convert SVG from clipboard to Data URL (PNG base64)")
  .option("-w, --width <width:number>", "Output image width", { default: 100 })
  .option("-h, --height <height:number>", "Output image height", {
    default: 100,
  })
  .action(async (options) => {
    const svgString = clipboard.readSync();
    if (!svgString) {
      console.error("Clipboard is empty");
      Deno.exit(1);
    }

    try {
      const dataURL = await svgToDataURL(
        svgString,
        options.width,
        options.height,
      );
      console.log(dataURL);

      // 同时复制到剪贴板
      clipboard.writeSync(dataURL);
      console.log("\n✓ Data URL copied to clipboard!");
    } catch (err) {
      console.error("Error converting SVG:", err);
      Deno.exit(1);
    }
  });

// 直接运行支持
if (import.meta.main) {
  await svgToDataCommand.parse(Deno.args);
}
