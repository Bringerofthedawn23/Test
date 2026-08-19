import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clear all upcoming tracks (keeps the current one playing)."),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const count = player.queue.tracks.length;
    if (count === 0) {
      await fail(interaction, "The queue is already empty.");
      return;
    }

    await player.queue.splice(0, count);
    await interaction.reply({
      embeds: [successEmbed(`Cleared **${count}** track(s) from the queue.`)],
    });
  },
};

export default command;
