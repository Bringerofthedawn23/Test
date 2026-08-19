import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { Colors } from "../utils/embeds.js";

const COMMANDS: Array<[string, string]> = [
  ["/play `query` `[source]`", "Play a track/playlist from a URL or search"],
  ["/pause", "Pause the current track"],
  ["/resume", "Resume playback"],
  ["/skip `[amount]`", "Skip one or more tracks"],
  ["/stop", "Stop and clear the queue (stay connected)"],
  ["/disconnect", "Leave the voice channel"],
  ["/queue `[page]`", "Show the queue"],
  ["/nowplaying", "Show the current track with progress"],
  ["/volume `[level]`", "Show or set volume (0-100)"],
  ["/seek `position`", "Jump to a position (e.g. 1:30)"],
  ["/loop `mode`", "Repeat off / track / queue"],
  ["/shuffle", "Shuffle the queue"],
  ["/remove `position`", "Remove a track from the queue"],
  ["/clear", "Clear all upcoming tracks"],
  ["/filters `effect`", "Bass boost, nightcore, 8D and more"],
];

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List every command this music bot supports."),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(Colors.primary)
      .setTitle("🎵 Music Bot — Commands")
      .setDescription(
        "Plays high-quality audio from **YouTube, YouTube Music, Spotify, " +
          "Apple Music, SoundCloud, Deezer, Bandcamp, Twitch** and direct links.",
      )
      .addFields(
        COMMANDS.map(([name, value]) => ({ name, value, inline: false })),
      )
      .setFooter({ text: "Tip: paste any supported link straight into /play" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
