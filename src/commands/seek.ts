import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";
import { formatDuration, isStream } from "../utils/format.js";

/** Parse `90`, `1:30` or `1:02:03` into milliseconds, or null. */
function parseTimestamp(input: string): number | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10) * 1000;
  }
  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;

  let seconds = 0;
  if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else return null;

  return seconds * 1000;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Jump to a position in the current track.")
    .addStringOption((opt) =>
      opt
        .setName("position")
        .setDescription("Position, e.g. 90, 1:30 or 1:02:03")
        .setRequired(true),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const current = player.queue.current!;
    if (isStream(current.info.duration) || !current.info.isSeekable) {
      await fail(interaction, "This track can't be seeked (it may be a livestream).");
      return;
    }

    const target = parseTimestamp(interaction.options.getString("position", true));
    if (target === null) {
      await fail(interaction, "Invalid time. Use seconds, `m:ss`, or `h:mm:ss`.");
      return;
    }
    if (target > current.info.duration) {
      await fail(
        interaction,
        `That's past the end of the track (${formatDuration(current.info.duration)}).`,
      );
      return;
    }

    await player.seek(target);
    await interaction.reply({
      embeds: [successEmbed(`Seeked to **${formatDuration(target)}**.`)],
    });
  },
};

export default command;
