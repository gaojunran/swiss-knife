import { Command } from "@cliffy/command";
import { killerCommand } from "./src/killer.ts";
import { todocxCommand } from "./src/todocx.ts";
import { svgToDataCommand } from "./src/svgToData.ts";

await new Command()
  .name("swiss-knife")
  .version("v1.0.0")
  .description("A Swiss Army knife CLI tool with multiple utilities")
  .command("killer", killerCommand)
  .command("todocx", todocxCommand)
  .command("svg2data", svgToDataCommand)
  .parse(Deno.args);
