import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and clear the queue (the bot stays connected)."),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    player.queue.tracks.splice(0, player.queue.tracks.length);
    await player.stopPlaying(true, false);

    await interaction.reply({
      embeds: [successEmbed("Stopped playback and cleared the queue.")],
    });
  },
};

export default command;
