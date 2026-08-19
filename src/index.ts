import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  MessageFlags,
  ActivityType,
} from "discord.js";
import { config } from "./config.js";
import type { BotClient } from "./types.js";
import { loadCommands } from "./handlers/commands.js";
import { deployCommands } from "./deploy-commands.js";
import { createLavalink } from "./lavalink/manager.js";
import { errorEmbed } from "./utils/embeds.js";

async function main(): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
    ],
  }) as BotClient;

  client.commands = new Collection();
  client.lavalink = createLavalink(client);

  // Forward raw voice gateway packets to Lavalink so it can join and
  // manage voice connections.
  client.on("raw", (d) => client.lavalink.sendRawData(d));

  // ── Ready ──────────────────────────────────────────────────
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`[bot] logged in as ${readyClient.user.tag}`);
    readyClient.user.setActivity("music • /play", {
      type: ActivityType.Listening,
    });
    // init() must run after the client has a user id.
    await client.lavalink.init({
      id: readyClient.user.id,
      username: readyClient.user.username,
    });
  });

  // ── Interactions ───────────────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          console.error(`[autocomplete] ${interaction.commandName}:`, err);
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[command] ${interaction.commandName} failed:`, err);
      const payload = {
        embeds: [errorEmbed("Something went wrong running that command.")],
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction
          .reply({ ...payload, flags: MessageFlags.Ephemeral })
          .catch(() => {});
      }
    }
  });

  // ── Boot ───────────────────────────────────────────────────
  client.commands = await loadCommands();

  // Register slash commands (safe to run every boot — it's a PUT).
  await deployCommands().catch((err) =>
    console.error("[deploy] command registration failed:", err),
  );

  await client.login(config.discord.token);
}

// ── Resilience: log rather than crash on unexpected errors ─────
process.on("unhandledRejection", (reason) =>
  console.error("[process] unhandled rejection:", reason),
);
process.on("uncaughtException", (err) =>
  console.error("[process] uncaught exception:", err),
);

main().catch((err) => {
  console.error("[bot] fatal startup error:", err);
  process.exit(1);
});
