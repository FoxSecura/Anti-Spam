import { DiscordJsAntiSpam } from "@foxsecura/anti-spam/discordjs";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const antiSpam = new DiscordJsAntiSpam(client, {
  modules: createDefaultAntiSpamPreset(),
  enforcement: {
    enabled: true,
    deleteMessages: true,
    timeout: {
      enabled: true,
      durationMs: 10 * 60 * 1000,
      minimumSeverity: "high",
    },
    warnMember: {
      enabled: true,
    },
  },
  onIncident: (incident) => {
    console.warn(`[FoxSecura Anti-Spam] ${incident.summary}`);
  },
});

antiSpam.start();
await client.login(process.env.DISCORD_TOKEN);
