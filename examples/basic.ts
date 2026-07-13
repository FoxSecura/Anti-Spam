import { DiscordJsAntiSpam } from "@foxsecura/anti-spam/discordjs";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const antiSpam = new DiscordJsAntiSpam(client, {
  modules: createDefaultAntiSpamPreset(),
  onIncident: async (incident) => {
    // Route incidents to your own moderation, logging, persistence, or dashboard layer.
    console.warn(incident);
  },
});

antiSpam.start();
