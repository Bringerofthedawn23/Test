import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { loadCommands } from "./handlers/commands.js";

/**
 * Register slash commands with Discord. If GUILD_ID is set the
 * commands register instantly to that guild (ideal for development);
 * otherwise they register globally.
 *
 * Run standalone with `npm run deploy`, but index.ts also calls this
 * on boot so a fresh deployment "just works".
 */
export async function deployCommands(): Promise<void> {
  const commands = await loadCommands();
  const body = commands.map((c) => c.data.toJSON());

  const rest = new REST().setToken(config.discord.token);

  if (config.discord.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(
        config.discord.clientId,
        config.discord.guildId,
      ),
      { body },
    );
    console.log(
      `[deploy] registered ${body.length} commands to guild ${config.discord.guildId}`,
    );
  } else {
    await rest.put(Routes.applicationCommands(config.discord.clientId), {
      body,
    });
    console.log(`[deploy] registered ${body.length} global commands`);
  }
}

// Allow running this file directly: `tsx src/deploy-commands.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCommands().catch((err) => {
    console.error("[deploy] failed:", err);
    process.exit(1);
  });
}
