import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { nowPlayingEmbed } from "../utils/embeds.js";
import { formatDuration, isStream, progressBar } from "../utils/format.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show what's currently playing, with progress."),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const track = player.queue.current!;
    const embed = nowPlayingEmbed(track);

    const position = player.position;
    const duration = track.info.duration;
    const bar = progressBar(position, duration);
    const times = isStream(duration)
      ? "🔴 LIVE"
      : `${formatDuration(position)} / ${formatDuration(duration)}`;

    embed.addFields({
      name: "Progress",
      value: `${bar}\n\`${times}\``,
      inline: false,
    });

    if (player.paused) {
      embed.setAuthor({ name: "Paused" });
    }
    embed.addFields(
      { name: "Volume", value: `${player.volume}%`, inline: true },
      { name: "Loop", value: player.repeatMode, inline: true },
      { name: "In queue", value: `${player.queue.tracks.length}`, inline: true },
    );

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
