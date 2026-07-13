import { describe, expect, it, vi } from "vitest";
import { AntiSpamEngine } from "../src/core/AntiSpamEngine.js";
import { createEmojiSpamModule } from "../src/modules/emojiSpam.js";
import { messageEvent } from "./helpers.js";

describe("AntiSpamEngine", () => {
  it("rejects duplicate module ids", () => {
    const module = createEmojiSpamModule();
    expect(
      () => new AntiSpamEngine({ modules: [module, module], onIncident: () => undefined }),
    ).toThrow("Duplicate anti-spam module id");
  });

  it("ignores events through the consumer callback", async () => {
    const onIncident = vi.fn();
    const engine = new AntiSpamEngine({
      modules: [createEmojiSpamModule({ threshold: 1 })],
      onIncident,
      shouldIgnore: () => true,
    });
    expect(await engine.handle(messageEvent({ content: "😀" }))).toEqual([]);
    expect(onIncident).not.toHaveBeenCalled();
  });

  it("forwards incidents to the consumer", async () => {
    const onIncident = vi.fn();
    const engine = new AntiSpamEngine({
      modules: [createEmojiSpamModule({ threshold: 1 })],
      onIncident,
    });
    const incidents = await engine.handle(messageEvent({ content: "😀" }));
    expect(incidents).toHaveLength(1);
    expect(onIncident).toHaveBeenCalledOnce();
  });
});
