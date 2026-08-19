import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types.js";
import { requireActivePlayer, fail } from "../utils/guards.js";
import { successEmbed } from "../utils/embeds.js";

/** A "bass boost" is just a positive gain on the low EQ bands. */
const BASSBOOST_EQ = [
  { band: 0, gain: 0.25 },
  { band: 1, gain: 0.25 },
  { band: 2, gain: 0.2 },
  { band: 3, gain: 0.1 },
];

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("filters")
    .setDescription("Apply an audio filter to the current playback.")
    .addStringOption((opt) =>
      opt
        .setName("effect")
        .setDescription("Which effect to apply")
        .setRequired(true)
        .addChoices(
          { name: "Off (reset all)", value: "off" },
          { name: "Bass boost", value: "bassboost" },
          { name: "Nightcore", value: "nightcore" },
          { name: "Vaporwave", value: "vaporwave" },
          { name: "8D / rotation", value: "8d" },
          { name: "Karaoke", value: "karaoke" },
          { name: "Low pass", value: "lowpass" },
        ),
    ),

  async execute(interaction) {
    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const effect = interaction.options.getString("effect", true);
    const fm = player.filterManager;

    switch (effect) {
      case "off":
        await fm.resetFilters();
        await fm.clearEQ();
        break;
      case "bassboost":
        await fm.setEQ(BASSBOOST_EQ);
        break;
      case "nightcore":
        await fm.toggleNightcore();
        break;
      case "vaporwave":
        await fm.toggleVaporwave();
        break;
      case "8d":
        await fm.toggleRotation();
        break;
      case "karaoke":
        await fm.toggleKaraoke();
        break;
      case "lowpass":
        await fm.toggleLowPass();
        break;
      default:
        await fail(interaction, "Unknown effect.");
        return;
    }

    const label = effect === "off" ? "Reset all filters." : `Applied **${effect}**.`;
    await interaction.reply({ embeds: [successEmbed(`${label} 🎛️`)] });
  },
};

export default command;
