import {
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import type { Player } from "lavalink-client";
import type { BotClient } from "../types.js";
import { errorEmbed } from "./embeds.js";

/** Reply with an ephemeral error embed. */
export async function fail(
  interaction: ChatInputCommandInteraction,
  message: string,
): Promise<void> {
  const payload = { embeds: [errorEmbed(message)] };
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
  } else {
    await interaction.reply({ ...payload, ephemeral: true });
  }
}

export interface VoiceContext {
  member: GuildMember;
  voiceChannelId: string;
}

/**
 * Ensure the command was run in a guild and the caller is in a
 * voice channel. Returns the context, or null after having already
 * sent an error reply.
 */
export async function requireVoice(
  interaction: ChatInputCommandInteraction,
): Promise<VoiceContext | null> {
  if (!interaction.inCachedGuild()) {
    await fail(interaction, "This command can only be used in a server.");
    return null;
  }

  const member = interaction.member as GuildMember;
  const voiceChannelId = member.voice.channelId;
  if (!voiceChannelId) {
    await fail(interaction, "You need to be in a voice channel first.");
    return null;
  }

  return { member, voiceChannelId };
}

/**
 * Get the active player for this guild and confirm the caller is in
 * the same voice channel as the bot. Returns null after replying on
 * failure.
 */
export async function requireActivePlayer(
  interaction: ChatInputCommandInteraction,
): Promise<Player | null> {
  const ctx = await requireVoice(interaction);
  if (!ctx) return null;

  const client = interaction.client as BotClient;
  const player = client.lavalink.getPlayer(interaction.guildId!);

  if (!player || !player.queue.current) {
    await fail(interaction, "Nothing is playing right now.");
    return null;
  }

  if (player.voiceChannelId && player.voiceChannelId !== ctx.voiceChannelId) {
    await fail(
      interaction,
      "You need to be in the same voice channel as the bot.",
    );
    return null;
  }

  return player;
}
