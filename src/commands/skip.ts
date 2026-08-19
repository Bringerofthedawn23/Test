import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";
import { truncate } from "../utils/format.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track (optionally skip several).")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("How many tracks to skip (default 1)")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const amount = interaction.options.getInteger("amount") ?? 1;
    const current = player.queue.current;

    // Nothing queued after this track: just stop the current one.
    if (player.queue.tracks.length === 0) {
      await player.stopPlaying(false, false);
      await interaction.reply({
        embeds: [
          successEmbed(
            `Skipped **${truncate(current?.info.title ?? "the track", 80)}**. Queue is now empty.`,
          ),
        ],
      });
      return;
    }

    const skipTo = Math.min(amount, player.queue.tracks.length);
    await player.skip(skipTo === 1 ? 0 : skipTo);

    await interaction.reply({
      embeds: [
        successEmbed(
          skipTo > 1
            ? `Skipped **${skipTo}** tracks.`
            : `Skipped **${truncate(current?.info.title ?? "the track", 80)}**.`,
        ),
      ],
    });
  },
};

export default command;
