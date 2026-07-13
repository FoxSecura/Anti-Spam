import { describe, expect, it } from "vitest";
import { createModuleContext } from "../src/core/incident.js";
import {
  createCapsSpamModule,
  createDuplicateMessageModule,
  createEmojiSpamModule,
  createLinkSpamModule,
  createMentionSpamModule,
  createMessageBurstModule,
} from "../src/modules/index.js";
import { messageEvent } from "./helpers.js";

const context = createModuleContext();

describe("anti-spam modules", () => {
  it("detects a message burst", () => {
    const module = createMessageBurstModule({ threshold: 3, windowMs: 1_000 });
    expect(module.evaluate(messageEvent({ messageId: "1", createdAt: 100 }), context)).toBeNull();
    expect(module.evaluate(messageEvent({ messageId: "2", createdAt: 200 }), context)).toBeNull();
    expect(
      module.evaluate(messageEvent({ messageId: "3", createdAt: 300 }), context)?.moduleId,
    ).toBe("message-burst");
  });

  it("detects duplicate normalized messages", () => {
    const module = createDuplicateMessageModule({ threshold: 2 });
    expect(
      module.evaluate(messageEvent({ messageId: "1", content: " Hello   WORLD " }), context),
    ).toBeNull();
    expect(
      module.evaluate(
        messageEvent({ messageId: "2", content: "hello world", createdAt: 2_000 }),
        context,
      )?.moduleId,
    ).toBe("duplicate-messages");
  });

  it("detects mention spam in one message", () => {
    const module = createMentionSpamModule({ perMessageThreshold: 3 });
    expect(module.evaluate(messageEvent({ mentionCount: 3 }), context)?.moduleId).toBe(
      "mention-spam",
    );
  });

  it("detects accumulated mention spam", () => {
    const module = createMentionSpamModule({ threshold: 4, perMessageThreshold: 10 });
    expect(module.evaluate(messageEvent({ messageId: "1", mentionCount: 2 }), context)).toBeNull();
    expect(
      module.evaluate(messageEvent({ messageId: "2", mentionCount: 2, createdAt: 2_000 }), context)
        ?.moduleId,
    ).toBe("mention-spam");
  });

  it("detects repeated links", () => {
    const module = createLinkSpamModule({ repeatedLinkThreshold: 2, threshold: 10 });
    expect(
      module.evaluate(messageEvent({ messageId: "1", content: "https://example.com" }), context),
    ).toBeNull();
    expect(
      module.evaluate(
        messageEvent({ messageId: "2", content: "https://example.com", createdAt: 2_000 }),
        context,
      )?.moduleId,
    ).toBe("link-spam");
  });

  it("detects many links in one message", () => {
    const module = createLinkSpamModule({ perMessageThreshold: 2 });
    expect(
      module.evaluate(messageEvent({ content: "https://a.example https://b.example" }), context)
        ?.moduleId,
    ).toBe("link-spam");
  });

  it("detects emoji spam", () => {
    const module = createEmojiSpamModule({ threshold: 3 });
    expect(module.evaluate(messageEvent({ content: "😀😀😀" }), context)?.moduleId).toBe(
      "emoji-spam",
    );
  });

  it("detects repeated caps messages", () => {
    const module = createCapsSpamModule({ threshold: 2, minimumLetters: 5, uppercaseRatio: 0.8 });
    expect(
      module.evaluate(messageEvent({ messageId: "1", content: "HELLO WORLD" }), context),
    ).toBeNull();
    expect(
      module.evaluate(
        messageEvent({ messageId: "2", content: "STOP SPAMMING", createdAt: 2_000 }),
        context,
      )?.moduleId,
    ).toBe("caps-spam");
  });

  it("honors module cooldowns", () => {
    const module = createMessageBurstModule({ threshold: 1, cooldownMs: 10_000 });
    expect(
      module.evaluate(messageEvent({ messageId: "1", createdAt: 1_000 }), context),
    ).not.toBeNull();
    expect(module.evaluate(messageEvent({ messageId: "2", createdAt: 2_000 }), context)).toBeNull();
  });

  it("resets a scoped author", () => {
    const module = createMessageBurstModule({ threshold: 2 });
    module.evaluate(messageEvent({ messageId: "1" }), context);
    module.reset?.({ authorId: "author-1" });
    expect(module.evaluate(messageEvent({ messageId: "2", createdAt: 2_000 }), context)).toBeNull();
  });
});
