import { SlashCommandBuilder } from "discord.js";
import type { RepeatMode } from "lavalink-client";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const LABELS: Record<RepeatMode, string> = {
  off: "Looping disabled.",
  track: "Now looping the **current track**. 🔂",
  queue: "Now looping the **whole queue**. 🔁",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set the repeat mode.")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("What to loop")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" },
        ),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const mode = interaction.options.getString("mode", true) as RepeatMode;
    await player.setRepeatMode(mode);

    await interaction.reply({ embeds: [successEmbed(LABELS[mode])] });
  },
};

export default command;
