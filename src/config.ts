import "dotenv/config";
import type { SearchPlatform } from "lavalink-client";

/**
 * Centralised, validated configuration. Reading env vars in one
 * place means the rest of the app can rely on typed values and we
 * fail fast at boot if something required is missing.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

function toInt(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  discord: {
    token: required("DISCORD_TOKEN"),
    clientId: required("CLIENT_ID"),
    // Empty guildId => register commands globally.
    guildId: optional("GUILD_ID", ""),
  },
  lavalink: {
    host: optional("LAVALINK_HOST", "localhost"),
    port: toInt(optional("LAVALINK_PORT", "2333"), 2333),
    password: optional("LAVALINK_PASSWORD", "youshallnotpass"),
    secure: optional("LAVALINK_SECURE", "false").toLowerCase() === "true",
  },
  playback: {
    defaultSearch: optional("DEFAULT_SEARCH", "ytmsearch") as SearchPlatform,
    defaultVolume: Math.max(
      0,
      Math.min(100, toInt(optional("DEFAULT_VOLUME", "80"), 80)),
    ),
  },
} as const;

export type BotConfig = typeof config;
