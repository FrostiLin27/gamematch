import { describe, expect, it } from "vitest";
import { games } from "../lib/games";
import { emptyPreferences, parseFreeText, recommendGames } from "../lib/recommender";

describe("recommendGames", () => {
  it("prioritizes a short, solo exploration game", () => {
    const matches = recommendGames({
      ...emptyPreferences,
      genres: ["冒險"],
      moods: ["探索"],
      modes: ["單人"],
      session: "short",
      difficulty: "easy",
      platforms: ["Switch"],
      avoid: ["恐怖"],
    }, [], 4);

    expect(matches.length).toBe(4);
    expect(matches[0].game.id).toBe("a-short-hike");
    expect(matches.some((match) => match.game.id === "phasmophobia")).toBe(false);
  });

  it("uses feedback history to avoid a disliked game", () => {
    const matches = recommendGames(emptyPreferences, [{
      gameId: "spiritfarer",
      status: "disliked",
      rating: 1,
      favorite: false,
      updatedAt: new Date().toISOString(),
    }], 25);

    expect(matches.some((match) => match.game.id === "spiritfarer")).toBe(false);
  });

  it("distinguishes Traditional Chinese interface, subtitles, and voice support", () => {
    const subtitleGame = {
      ...games[0],
      id: "subtitle-game",
      traditionalChineseInterface: false,
      traditionalChineseSubtitles: true,
      traditionalChineseVoice: false,
    };
    const interfaceOnlyGame = {
      ...games[0],
      id: "interface-game",
      traditionalChineseInterface: true,
      traditionalChineseSubtitles: false,
      traditionalChineseVoice: false,
    };

    const matches = recommendGames({
      ...emptyPreferences,
      language: ["需要繁體中文字幕"],
    }, [], 2, [interfaceOnlyGame, subtitleGame]);

    expect(matches[0].game.id).toBe("subtitle-game");
  });
});

describe("parseFreeText", () => {
  it("extracts positive preferences and avoids negative tags", () => {
    const preferences = parseFreeText("我想一個人玩短時間的探索遊戲，要繁體中文，不要恐怖");

    expect(preferences.modes).toContain("單人");
    expect(preferences.moods).toContain("探索");
    expect(preferences.session).toBe("short");
    expect(preferences.language).toContain("需要繁體中文介面");
    expect(preferences.avoid).toContain("恐怖");
    expect(preferences.genres).not.toContain("恐怖");
  });
});
