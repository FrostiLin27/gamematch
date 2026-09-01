import type { HistoryItem } from "./recommender";

const historyStorageKey = "game-match-history";
const deletedGamesStorageKey = "game-match-deleted-games";

function scopedKey(key: string, userId?: string) {
  return userId ? `${key}:${userId}` : key;
}

export function readLocalHistory(userId?: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(scopedKey(historyStorageKey, userId)) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item): item is HistoryItem => Boolean(item && typeof item === "object" && typeof item.gameId === "string"))
      : [];
  } catch {
    return [];
  }
}

export function writeLocalHistory(items: HistoryItem[], userId?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(scopedKey(historyStorageKey, userId), JSON.stringify(items));
}

function readDeletedGames(userId?: string) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(scopedKey(deletedGamesStorageKey, userId)) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function readDeletedGameIds(userId?: string) {
  return readDeletedGames(userId);
}

export function markGameDeleted(gameId: string, userId?: string) {
  if (typeof window === "undefined") return;
  const ids = new Set(readDeletedGames(userId));
  ids.add(gameId);
  window.localStorage.setItem(scopedKey(deletedGamesStorageKey, userId), JSON.stringify([...ids]));
}

export function unmarkGameDeleted(gameId: string, userId?: string) {
  if (typeof window === "undefined") return;
  const ids = readDeletedGames(userId).filter((id) => id !== gameId);
  window.localStorage.setItem(scopedKey(deletedGamesStorageKey, userId), JSON.stringify(ids));
}

export function removeLocalHistoryItem(gameId: string, userId?: string) {
  if (typeof window === "undefined") return;
  const nextHistory = readLocalHistory(userId).filter((item) => item.gameId !== gameId);
  writeLocalHistory(nextHistory, userId);
}
