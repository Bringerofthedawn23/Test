import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { successEmbed, infoEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Show or set the playback volume (0-100).")
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("New volume from 0 to 100")
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const level = interaction.options.getInteger("level");
    if (level === null) {
      await interaction.reply({
        embeds: [infoEmbed(`🔊 Current volume: **${player.volume}%**`)],
      });
      return;
    }

    await player.setVolume(level);
    await interaction.reply({
      embeds: [successEmbed(`Set volume to **${level}%**.`)],
    });
  },
};

export default command;
