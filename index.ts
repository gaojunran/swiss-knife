import { Command } from "@cliffy/command";
import { killCommand } from "./src/kill.ts";
import { todocxCommand } from "./src/todocx.ts";
import { svgToDataCommand } from "./src/svgToData.ts";
import { eachCommand } from "./src/each.ts";
import { mailMeCommand } from "./src/mailMe.ts";
import { toPngCommand } from "./src/toPng.ts";

await new Command()
  .name("swiss-knife")
  .version("v1.0.0")
  .description("A Swiss Army knife CLI tool with multiple utilities")
  .command("kill", killCommand)
  .command("todocx", todocxCommand)
  .command("svg2data", svgToDataCommand)
  .command("topng", toPngCommand)
  .command("each", eachCommand)
  .command("mailme", mailMeCommand)
  .parse(Deno.args);
