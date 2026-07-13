import { describe, expect, it } from "vitest";
import { createDefaultAntiSpamPreset } from "../src/presets/default.js";

describe("default preset", () => {
  it("contains six independent modules", () => {
    const modules = createDefaultAntiSpamPreset();
    expect(modules.map((module) => module.id)).toEqual([
      "message-burst",
      "duplicate-messages",
      "mention-spam",
      "link-spam",
      "emoji-spam",
      "caps-spam",
    ]);
  });

  it("can disable selected modules", () => {
    const modules = createDefaultAntiSpamPreset({ disabledModules: ["caps-spam", "emoji-spam"] });
    expect(modules).toHaveLength(4);
  });
});
