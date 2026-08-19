import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { Colors } from "../utils/embeds.js";
import { formatDuration, isStream, truncate } from "../utils/format.js";

const PAGE_SIZE = 10;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue.")
    .addIntegerOption((opt) =>
      opt
        .setName("page")
        .setDescription("Page number to view")
        .setMinValue(1)
        .setRequired(false),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const current = player.queue.current!;
    const upcoming = player.queue.tracks;

    const totalPages = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
    const page = Math.min(
      interaction.options.getInteger("page") ?? 1,
      totalPages,
    );
    const start = (page - 1) * PAGE_SIZE;
    const slice = upcoming.slice(start, start + PAGE_SIZE);

    const embed = new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle("🎶 Queue");

    const nowLine = `**${truncate(current.info.title, 70)}**${
      current.info.uri ? ` — [link](${current.info.uri})` : ""
    }\n\`${
      isStream(current.info.duration)
        ? "🔴 LIVE"
        : formatDuration(current.info.duration)
    }\``;
    embed.addFields({ name: "Now playing", value: nowLine });

    if (slice.length > 0) {
      const lines = slice.map((track, i) => {
        const idx = start + i + 1;
        const dur = isStream(track.info.duration)
          ? "LIVE"
          : formatDuration(track.info.duration);
        return `\`${idx}.\` ${truncate(track.info.title, 60)} \`[${dur}]\``;
      });
      embed.addFields({ name: "Up next", value: lines.join("\n") });
    } else {
      embed.addFields({ name: "Up next", value: "*Nothing queued.*" });
    }

    const totalMs = upcoming.reduce((sum, t) => sum + (t.info.duration ?? 0), 0);
    embed.setFooter({
      text: [
        `Page ${page}/${totalPages}`,
        `${upcoming.length} in queue`,
        `${formatDuration(totalMs)} total`,
        `Loop: ${player.repeatMode}`,
      ].join(" • "),
    });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
