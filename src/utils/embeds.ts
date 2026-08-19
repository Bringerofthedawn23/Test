import { EmbedBuilder, type ColorResolvable } from "discord.js";
import type { Track } from "lavalink-client";
import { formatDuration, isStream, truncate } from "./format.js";

/** Consistent colour palette so every reply feels like one bot. */
export const Colors = {
  primary: 0x5865f2, // Discord blurple
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
} as const;

function base(color: ColorResolvable): EmbedBuilder {
  return new EmbedBuilder().setColor(color);
}

export function successEmbed(message: string): EmbedBuilder {
  return base(Colors.success).setDescription(`✅ ${message}`);
}

export function errorEmbed(message: string): EmbedBuilder {
  return base(Colors.error).setDescription(`❌ ${message}`);
}

export function infoEmbed(message: string): EmbedBuilder {
  return base(Colors.primary).setDescription(message);
}

/** Best-effort track thumbnail (YouTube/Spotify supply artworkUrl). */
function artwork(track: Track): string | null {
  return track.info.artworkUrl ?? null;
}

function requesterTag(track: Track): string | null {
  const requester = track.requester as { tag?: string; username?: string } | undefined;
  return requester?.tag ?? requester?.username ?? null;
}

/** "Added to queue" embed shown when a single track is enqueued. */
export function addedTrackEmbed(track: Track, position: number): EmbedBuilder {
  const embed = base(Colors.primary)
    .setAuthor({ name: "Added to queue" })
    .setTitle(truncate(track.info.title, 90))
    .addFields(
      {
        name: "Duration",
        value: isStream(track.info.duration)
          ? "🔴 LIVE"
          : formatDuration(track.info.duration),
        inline: true,
      },
      { name: "Position", value: `#${position}`, inline: true },
    );

  if (track.info.uri) embed.setURL(track.info.uri);
  if (track.info.author) {
    embed.addFields({ name: "Artist", value: truncate(track.info.author, 60), inline: true });
  }
  const art = artwork(track);
  if (art) embed.setThumbnail(art);
  const tag = requesterTag(track);
  if (tag) embed.setFooter({ text: `Requested by ${tag}` });

  return embed;
}

/** "Added playlist" embed shown when a playlist/album is enqueued. */
export function addedPlaylistEmbed(
  name: string,
  trackCount: number,
  totalDurationMs: number,
): EmbedBuilder {
  return base(Colors.primary)
    .setAuthor({ name: "Added playlist to queue" })
    .setTitle(truncate(name, 90))
    .addFields(
      { name: "Tracks", value: `${trackCount}`, inline: true },
      {
        name: "Total length",
        value: formatDuration(totalDurationMs),
        inline: true,
      },
    );
}

/** "Now playing" embed used on trackStart and by /nowplaying. */
export function nowPlayingEmbed(track: Track): EmbedBuilder {
  const embed = base(Colors.success)
    .setAuthor({ name: "Now playing" })
    .setTitle(truncate(track.info.title, 90));

  if (track.info.uri) embed.setURL(track.info.uri);
  if (track.info.author) {
    embed.addFields({ name: "Artist", value: truncate(track.info.author, 60), inline: true });
  }
  embed.addFields({
    name: "Duration",
    value: isStream(track.info.duration)
      ? "🔴 LIVE"
      : formatDuration(track.info.duration),
    inline: true,
  });

  const art = artwork(track);
  if (art) embed.setThumbnail(art);
  const tag = requesterTag(track);
  if (tag) embed.setFooter({ text: `Requested by ${tag}` });

  return embed;
}
