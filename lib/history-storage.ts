const deletedGamesStorageKey = "game-match-deleted-games";

function readDeletedGames() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(deletedGamesStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function readDeletedGameIds() {
  return readDeletedGames();
}

export function markGameDeleted(gameId: string) {
  if (typeof window === "undefined") return;
  const ids = new Set(readDeletedGames());
  ids.add(gameId);
  window.localStorage.setItem(deletedGamesStorageKey, JSON.stringify([...ids]));
}

export function unmarkGameDeleted(gameId: string) {
  if (typeof window === "undefined") return;
  const ids = readDeletedGames().filter((id) => id !== gameId);
  window.localStorage.setItem(deletedGamesStorageKey, JSON.stringify(ids));
}

export function removeLocalHistoryItem(gameId: string) {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem("game-match-history");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return;
    const nextHistory = parsed.filter((item) => !(item && typeof item === "object" && (item as { gameId?: unknown }).gameId === gameId));
    window.localStorage.setItem("game-match-history", JSON.stringify(nextHistory));
  } catch {
    // Local storage is only a cache; the cloud operation remains authoritative.
  }
}
