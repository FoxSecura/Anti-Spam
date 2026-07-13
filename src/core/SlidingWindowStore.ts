interface TimestampedValue<T> {
  timestamp: number;
  value: T;
}

export class SlidingWindowStore<T> {
  readonly #entries = new Map<string, TimestampedValue<T>[]>();

  add(key: string, timestamp: number, value: T): void {
    const entries = this.#entries.get(key) ?? [];
    entries.push({ timestamp, value });
    this.#entries.set(key, entries);
  }

  values(key: string, since: number): readonly T[] {
    const active = this.#activeEntries(key, since);
    return active.map((entry) => entry.value);
  }

  count(key: string, since: number): number {
    return this.#activeEntries(key, since).length;
  }

  clear(predicate?: (key: string) => boolean): void {
    if (!predicate) {
      this.#entries.clear();
      return;
    }

    for (const key of this.#entries.keys()) {
      if (predicate(key)) {
        this.#entries.delete(key);
      }
    }
  }

  #activeEntries(key: string, since: number): TimestampedValue<T>[] {
    const entries = this.#entries.get(key);
    if (!entries) {
      return [];
    }

    const active = entries.filter((entry) => entry.timestamp >= since);
    if (active.length === 0) {
      this.#entries.delete(key);
    } else if (active.length !== entries.length) {
      this.#entries.set(key, active);
    }

    return active;
  }
}
