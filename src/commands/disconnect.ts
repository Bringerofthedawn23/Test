import { SlashCommandBuilder } from "discord.js";
import type { BotClient, Command } from "../types.js";
import { requireVoice, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("Disconnect the bot from the voice channel."),

  async execute(interaction) {
    const ctx = await requireVoice(interaction);
    if (!ctx) return;

    const client = interaction.client as BotClient;
    const player = client.lavalink.getPlayer(interaction.guildId!);

    if (!player) {
      await fail(interaction, "I'm not connected to a voice channel.");
      return;
    }

    if (player.voiceChannelId && player.voiceChannelId !== ctx.voiceChannelId) {
      await fail(
        interaction,
        "You need to be in the same voice channel as the bot.",
      );
      return;
    }

    await player.destroy();
    await interaction.reply({
      embeds: [successEmbed("Disconnected. See you next time! 👋")],
    });
  },
};

export default command;
