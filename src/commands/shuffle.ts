import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the tracks currently in the queue."),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    if (player.queue.tracks.length < 2) {
      await fail(interaction, "There aren't enough tracks in the queue to shuffle.");
      return;
    }

    await player.queue.shuffle();
    await interaction.reply({
      embeds: [
        successEmbed(`Shuffled **${player.queue.tracks.length}** tracks. 🔀`),
      ],
    });
  },
};

export default command;
