import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";
import { truncate } from "../utils/format.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a track from the queue by its position.")
    .addIntegerOption((opt) =>
      opt
        .setName("position")
        .setDescription("Queue position to remove (see /queue)")
        .setMinValue(1)
        .setRequired(true),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const position = interaction.options.getInteger("position", true);
    const index = position - 1;

    if (index >= player.queue.tracks.length) {
      await fail(
        interaction,
        `There's no track at position **${position}**. The queue has ${player.queue.tracks.length} track(s).`,
      );
      return;
    }

    const [removed] = await player.queue.splice(index, 1);
    await interaction.reply({
      embeds: [
        successEmbed(
          `Removed **${truncate(removed?.info.title ?? "track", 80)}** from the queue.`,
        ),
      ],
    });
  },
};

export default command;
