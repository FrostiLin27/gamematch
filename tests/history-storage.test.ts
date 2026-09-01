import { afterEach, describe, expect, it } from "vitest";
import {
  markGameDeleted,
  readDeletedGameIds,
  readLocalHistory,
  unmarkGameDeleted,
  writeLocalHistory,
} from "../lib/history-storage";

function installLocalStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } as Storage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("account-scoped history storage", () => {
  it("keeps each account's local history separate", () => {
    installLocalStorage();
    const accountA = [{ gameId: "game-a", status: "liked" as const, rating: 5, favorite: true, updatedAt: "2026-09-02T00:00:00.000Z" }];
    const accountB = [{ gameId: "game-b", status: "neutral" as const, rating: 0, favorite: false, updatedAt: "2026-09-02T00:00:00.000Z" }];

    writeLocalHistory(accountA, "user-a");
    writeLocalHistory(accountB, "user-b");

    expect(readLocalHistory("user-a")).toEqual(accountA);
    expect(readLocalHistory("user-b")).toEqual(accountB);
    expect(readLocalHistory()).toEqual([]);
  });

  it("keeps deleted-game markers separate between accounts", () => {
    installLocalStorage();

    markGameDeleted("game-a", "user-a");

    expect(readDeletedGameIds("user-a")).toEqual(["game-a"]);
    expect(readDeletedGameIds("user-b")).toEqual([]);

    unmarkGameDeleted("game-a", "user-a");
    expect(readDeletedGameIds("user-a")).toEqual([]);
  });
});
