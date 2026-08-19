import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { Collection } from "discord.js";
import type { Command } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically load every command module in src/commands. Each file
 * default-exports a `Command`. Returning a Collection keyed by name
 * makes dispatch in the interaction handler a single map lookup.
 */
export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  const commandsDir = join(__dirname, "..", "commands");

  const files = (await readdir(commandsDir)).filter((f) =>
    f.endsWith(".js") || f.endsWith(".ts"),
  );

  for (const file of files) {
    const moduleUrl = pathToFileURL(join(commandsDir, file)).href;
    const mod = (await import(moduleUrl)) as { default?: Command };
    const command = mod.default;

    if (!command?.data || typeof command.execute !== "function") {
      console.warn(`[commands] skipping ${file}: missing data/execute export`);
      continue;
    }

    commands.set(command.data.name, command);
  }

  console.log(`[commands] loaded ${commands.size} commands`);
  return commands;
}
