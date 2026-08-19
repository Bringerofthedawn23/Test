/** Small, dependency-free formatting helpers shared across commands. */

/** Format a millisecond duration as `h:mm:ss` or `m:ss`. */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms <= 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/** A livestream reports 0 or a sentinel duration; label it clearly. */
export function isStream(durationMs: number | undefined): boolean {
  return durationMs === undefined || !Number.isFinite(durationMs) || durationMs <= 0;
}

/** Truncate text to a max length, adding an ellipsis when cut. */
export function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/**
 * Render a simple text progress bar for the "now playing" display.
 * e.g. `▬▬▬🔘▬▬▬▬▬▬`
 */
export function progressBar(
  positionMs: number,
  durationMs: number | undefined,
  size = 15,
): string {
  if (durationMs === undefined || !Number.isFinite(durationMs) || durationMs <= 0) {
    return "🔴 LIVE";
  }
  const ratio = Math.min(1, Math.max(0, positionMs / durationMs));
  const knob = Math.round(ratio * (size - 1));
  let bar = "";
  for (let i = 0; i < size; i++) {
    bar += i === knob ? "🔘" : "▬";
  }
  return bar;
}
