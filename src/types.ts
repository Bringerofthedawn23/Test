import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  AutocompleteInteraction,
  Client,
  Collection,
} from "discord.js";
import type { LavalinkManager } from "lavalink-client";

/** A single slash command module. */
export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  /** Handle the command invocation. */
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  /** Optional autocomplete handler (used by /play for search). */
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

/**
 * discord.js Client augmented with the pieces this bot attaches to
 * it: the loaded command collection and the Lavalink manager.
 */
export interface BotClient extends Client {
  commands: Collection<string, Command>;
  lavalink: LavalinkManager;
}
