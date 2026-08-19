# 🎵 Multi-Platform Discord Music Bot

A production-ready Discord music bot that plays **high-quality audio** from many
platforms. Built on [discord.js v14](https://discord.js.org) and
[Lavalink v4](https://lavalink.dev) — the gold standard for Discord audio —
so playback is smooth, gapless, and streamed as high-bitrate Opus.

## ✨ Features

- **Multi-platform** — YouTube, YouTube Music, Spotify, Apple Music, SoundCloud,
  Deezer, Bandcamp, Twitch, Vimeo and direct HTTP streams. Paste a link or just
  search by name.
- **Best-available quality** — Lavalink is tuned for `opusEncodingQuality: 10`
  and high-quality resampling, with buffers sized to avoid stutter.
- **Full playback control** — play, pause, resume, skip, seek, stop, volume,
  loop (track/queue), shuffle, and per-position queue editing.
- **Queue management** — paginated queue, now-playing with a live progress bar,
  remove/clear, playlist & album support.
- **Audio filters** — bass boost, nightcore, vaporwave, 8D, karaoke, low-pass.
- **Slash commands** with autocomplete search on `/play`.
- **Robust** — auto-reconnect to Lavalink, auto-leave when idle, and graceful
  error handling so one bad track never takes the bot down.

## 🧱 Architecture

```
Discord  ⇄  Bot (discord.js, this project)  ⇄  Lavalink node (audio engine)
                                                  ├─ youtube-source plugin
                                                  └─ LavaSrc plugin (Spotify, …)
```

The bot never touches raw audio — it tells Lavalink what to play and Lavalink
streams it into the voice channel. That separation is what keeps quality high
and the bot process light.

## 🚀 Quick start (Docker — recommended)

Everything (bot **and** Lavalink) runs with one command.

1. **Create a bot application** at the
   [Discord Developer Portal](https://discord.com/developers/applications):
   - Copy the **token** and **Application ID**.
   - Invite it with the `bot` + `applications.commands` scopes and the
     **Connect** / **Speak** voice permissions.

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # edit .env — set DISCORD_TOKEN and CLIENT_ID (GUILD_ID optional for dev)
   ```

3. **Run it:**

   ```bash
   docker compose up -d --build
   ```

   Lavalink boots first (health-checked), then the bot registers its slash
   commands and logs in. Watch the logs with `docker compose logs -f bot`.

## 🛠️ Local development (without Docker for the bot)

You still need a Lavalink node. The easiest way is to run just Lavalink via
Docker and point the bot at it:

```bash
docker compose up -d lavalink        # start only the audio node
cp .env.example .env                 # set LAVALINK_HOST=localhost
npm install
npm run deploy                       # register slash commands
npm run dev                          # start the bot with hot reload
```

## 🎧 Enabling Spotify / Apple Music / Deezer

YouTube, YouTube Music, SoundCloud, Bandcamp, Twitch and Vimeo work out of the
box. To resolve Spotify/Apple Music/Deezer links and searches, add credentials:

1. Create a Spotify app at the
   [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and
   put the client ID/secret in `.env`.
2. Enable the source in `lavalink/application.yml` under `plugins.lavasrc.sources`
   (Spotify is on by default once credentials are present; set `applemusic` /
   `deezer` to `true` and supply their tokens to enable those).
3. Restart Lavalink: `docker compose restart lavalink`.

> Tracks are resolved to a playable stream (Spotify metadata → matched audio),
> which is how every open-source Lavalink bot handles these platforms.

## 📋 Commands

| Command | Description |
| --- | --- |
| `/play query [source]` | Play a track/playlist by URL or search |
| `/pause` · `/resume` | Pause / resume playback |
| `/skip [amount]` | Skip one or more tracks |
| `/stop` | Stop and clear the queue (stay connected) |
| `/disconnect` | Leave the voice channel |
| `/queue [page]` | Show the queue |
| `/nowplaying` | Current track + progress bar |
| `/volume [level]` | Show or set volume (0–100) |
| `/seek position` | Jump to `90`, `1:30`, or `1:02:03` |
| `/loop mode` | Repeat off / track / queue |
| `/shuffle` | Shuffle the queue |
| `/remove position` | Remove a queued track |
| `/clear` | Clear upcoming tracks |
| `/filters effect` | Bass boost, nightcore, 8D, karaoke, … |
| `/help` | List all commands |

## ⚙️ Configuration reference

All configuration is via environment variables — see
[`.env.example`](./.env.example) for the full annotated list. Lavalink audio
tuning lives in [`lavalink/application.yml`](./lavalink/application.yml).

## 📦 Tech stack

- **discord.js v14** — Discord gateway & slash commands
- **lavalink-client v2** — modern Lavalink client for Node
- **Lavalink v4** + `youtube-source` + `LavaSrc` plugins — the audio engine
- **TypeScript** — end to end

## 📝 License

MIT
