import { describe, expect, it } from "vitest";
import { SlidingWindowStore } from "../src/core/SlidingWindowStore.js";

describe("SlidingWindowStore", () => {
  it("returns only active entries", () => {
    const store = new SlidingWindowStore<string>();
    store.add("key", 100, "old");
    store.add("key", 200, "new");
    expect(store.values("key", 150)).toEqual(["new"]);
  });

  it("clears selected keys", () => {
    const store = new SlidingWindowStore<string>();
    store.add("a", 100, "a");
    store.add("b", 100, "b");
    store.clear((key) => key === "a");
    expect(store.count("a", 0)).toBe(0);
    expect(store.count("b", 0)).toBe(1);
  });
});
