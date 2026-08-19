import { LavalinkManager } from "lavalink-client";
import { type TextChannel, type Client } from "discord.js";
import { config } from "../config.js";
import { nowPlayingEmbed } from "../utils/embeds.js";

/**
 * Build the LavalinkManager and wire it to a discord.js client.
 *
 * The manager owns the WebSocket to the Lavalink node, all players,
 * queues and audio events. discord.js only forwards raw voice
 * gateway packets to it (see the `raw` listener below).
 */
export function createLavalink(client: Client): LavalinkManager {
  const lavalink = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host: config.lavalink.host,
        port: config.lavalink.port,
        authorization: config.lavalink.password,
        secure: config.lavalink.secure,
        // Reconnect with backoff instead of giving up on a blip.
        retryAmount: 10,
        retryDelay: 5000,
      },
    ],
    // How the manager sends voice payloads back through the shard.
    sendToShard: (guildId, payload) =>
      client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: {
      id: config.discord.clientId,
      username: "MusicBot",
    },
    playerOptions: {
      defaultSearchPlatform: config.playback.defaultSearch,
      volumeDecrementer: 1,
      // Deafen on join — a music bot never needs to hear.
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false,
      },
      // Leave shortly after the queue empties or everyone leaves.
      onEmptyQueue: {
        destroyAfterMs: 60_000,
      },
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  registerNodeEvents(lavalink);
  registerPlayerEvents(lavalink, client);

  return lavalink;
}

function registerNodeEvents(lavalink: LavalinkManager): void {
  lavalink.nodeManager
    .on("connect", (node) =>
      console.log(`[lavalink] node "${node.id}" connected`),
    )
    .on("disconnect", (node, reason) =>
      console.warn(
        `[lavalink] node "${node.id}" disconnected:`,
        reason?.reason ?? reason,
      ),
    )
    .on("error", (node, error) =>
      console.error(`[lavalink] node "${node.id}" error:`, error?.message ?? error),
    )
    .on("reconnecting", (node) =>
      console.warn(`[lavalink] node "${node.id}" reconnecting…`),
    );
}

function registerPlayerEvents(lavalink: LavalinkManager, client: Client): void {
  const sendToText = async (
    guildId: string,
    channelId: string | null | undefined,
    embed: ReturnType<typeof nowPlayingEmbed>,
  ) => {
    if (!channelId) return;
    try {
      const channel = (await client.channels.fetch(channelId)) as TextChannel | null;
      if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] });
      }
    } catch {
      // Channel may have been deleted or perms revoked — ignore.
    }
    void guildId;
  };

  lavalink
    .on("trackStart", (player, track) => {
      if (!track) return;
      void sendToText(player.guildId, player.textChannelId, nowPlayingEmbed(track));
    })
    .on("trackError", (player, track, payload) =>
      console.error(
        `[lavalink] track error in ${player.guildId} (${track?.info.title}):`,
        payload?.exception?.message ?? payload,
      ),
    )
    .on("trackStuck", (player, track) =>
      console.warn(
        `[lavalink] track stuck in ${player.guildId}: ${track?.info.title}`,
      ),
    )
    .on("playerDestroy", (player) =>
      console.log(`[lavalink] player destroyed in guild ${player.guildId}`),
    );
}
