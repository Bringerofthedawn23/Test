import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause the current track."),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    if (player.paused) {
      await fail(interaction, "The track is already paused.");
      return;
    }

    await player.pause();
    await interaction.reply({ embeds: [successEmbed("Paused playback.")] });
  },
};

export default command;
