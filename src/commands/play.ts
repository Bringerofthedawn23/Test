import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
} from "discord.js";
import type { SearchPlatform, Track } from "lavalink-client";
import type { BotClient, Command } from "../types.js";
import { config } from "../config.js";
import { requireVoice, fail } from "../utils/guards.js";
import { addedPlaylistEmbed, addedTrackEmbed } from "../utils/embeds.js";
import { truncate } from "../utils/format.js";

/** User-selectable source platforms, mapped to Lavalink search prefixes. */
const SOURCES: Record<string, SearchPlatform> = {
  "YouTube Music": "ytmsearch",
  YouTube: "ytsearch",
  Spotify: "spsearch",
  "Apple Music": "amsearch",
  SoundCloud: "scsearch",
  Deezer: "dzsearch",
};

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song or playlist from a URL or a search query.")
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("A song name, or a URL from any supported platform")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("source")
        .setDescription("Which platform to search (ignored when a URL is given)")
        .setRequired(false)
        .addChoices(
          ...Object.keys(SOURCES).map((name) => ({ name, value: name })),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const ctx = await requireVoice(interaction);
    if (!ctx) return;

    await interaction.deferReply();

    const client = interaction.client as BotClient;
    const query = interaction.options.getString("query", true);
    const sourceName = interaction.options.getString("source");
    const source = sourceName ? SOURCES[sourceName] : config.playback.defaultSearch;

    // Get or create a player for this guild and connect it.
    const player =
      client.lavalink.getPlayer(interaction.guildId!) ??
      client.lavalink.createPlayer({
        guildId: interaction.guildId!,
        voiceChannelId: ctx.voiceChannelId,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        selfMute: false,
        volume: config.playback.defaultVolume,
      });

    if (!player.connected) {
      await player.connect();
    }

    // Keep the text channel current so "now playing" posts here.
    player.textChannelId = interaction.channelId;

    // A raw URL should be resolved by its own source, not the search
    // prefix; lavalink-client detects this when `source` is omitted.
    const isUrl = /^https?:\/\//i.test(query.trim());
    const result = await player.search(
      isUrl ? { query } : { query, source },
      interaction.user,
    );

    if (!result || result.loadType === "error") {
      await fail(interaction, "There was an error resolving that track.");
      return;
    }
    if (result.loadType === "empty" || result.tracks.length === 0) {
      await fail(interaction, "No results found for that query.");
      return;
    }

    if (result.loadType === "playlist") {
      await player.queue.add(result.tracks);
      const total = result.tracks.reduce(
        (sum, t) => sum + (t.info.duration || 0),
        0,
      );
      await interaction.editReply({
        embeds: [
          addedPlaylistEmbed(
            result.playlist?.name ?? "Playlist",
            result.tracks.length,
            total,
          ),
        ],
      });
    } else {
      const track = result.tracks[0] as Track;
      await player.queue.add(track);
      const position = player.queue.tracks.length;
      await interaction.editReply({
        embeds: [addedTrackEmbed(track, position)],
      });
    }

    if (!player.playing && !player.paused) {
      await player.play();
    }
  },

  async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const client = interaction.client as BotClient;
    const focused = interaction.options.getFocused().trim();

    // Don't search on empty input or raw URLs.
    if (!focused || /^https?:\/\//i.test(focused)) {
      await interaction.respond([]).catch(() => {});
      return;
    }

    const node = client.lavalink.nodeManager.leastUsedNodes()[0];
    if (!node?.connected) {
      await interaction.respond([]).catch(() => {});
      return;
    }

    try {
      const res = await node.search(
        { query: focused, source: config.playback.defaultSearch },
        interaction.user,
        false,
      );
      const choices = (res?.tracks ?? []).slice(0, 25).map((t) => ({
        name: truncate(
          `${t.info.title}${t.info.author ? ` — ${t.info.author}` : ""}`,
          100,
        ),
        value: truncate(t.info.uri ?? t.info.title, 100),
      }));
      await interaction.respond(choices).catch(() => {});
    } catch {
      await interaction.respond([]).catch(() => {});
    }
  },
};

export default command;
