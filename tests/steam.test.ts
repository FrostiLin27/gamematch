import { describe, expect, it } from "vitest";
import { toCatalogRow, type SteamGame } from "../lib/steam";

const sampleSteamGame: SteamGame = {
  appId: 1145360,
  name: "Hades",
  description: "Defy the god of the dead.",
  genres: ["動作", "角色扮演", "獨立製作"],
  modes: ["單人"],
  platforms: ["PC"],
  priceType: "paid",
  priceRange: "NT$ 408",
  languages: ["英文", "簡體中文"],
  coverUrl: "https://example.com/cover.jpg",
  headerImage: "https://example.com/header.jpg",
  steamUrl: "https://store.steampowered.com/app/1145360/",
  releaseDate: "2020 年 9 月 17 日",
  metacriticScore: 93,
};

describe("toCatalogRow", () => {
  it("maps Steam metadata into a stable games row", () => {
    const row = toCatalogRow(sampleSteamGame);

    expect(row.id).toBe("steam-1145360");
    expect(row.source).toBe("steam");
    expect(row.external_id).toBe("1145360");
    expect(row.genres).toEqual(["動作", "角色扮演", "敘事"]);
    expect(row.modes).toEqual(["單人"]);
    expect(row.cover_url).toBe(sampleSteamGame.coverUrl);
    expect(row.metacritic_score).toBe(93);
    expect(row.traditional_chinese_interface).toBe(false);
    expect(row.traditional_chinese_subtitles).toBe(false);
    expect(row.traditional_chinese_voice).toBe(false);
  });

  it("uses the official Traditional Chinese title and description when available", () => {
    const row = toCatalogRow({
      ...sampleSteamGame,
      appId: 1145360,
      name: "Hades",
      nameEn: "Hades",
      description: "Defy the god of the dead.",
    });

    expect(row.name_zh).toBe("黑帝斯");
    expect(row.name_en).toBe("Hades");
    expect(row.description).toContain("挑戰冥界之神");
  });

  it("adds the app's 建造 category to building-focused imports", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 427520, name: "Factorio" });

    expect(row.genres).toContain("建造");
  });

  it("adds the app's 派對 category to social multiplayer imports", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 1260320, name: "Party Animals" });

    expect(row.genres).toContain("派對");
  });

  it("adds curated atmosphere tags to mood-focused imports", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 1290000, name: "PowerWash Simulator" });

    expect(row.moods).toContain("放鬆");
  });

  it("marks curated co-op imports as both multiplayer and cooperative", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 548430, name: "Deep Rock Galactic" });

    expect(row.modes).toEqual(["單人", "多人", "合作"]);
  });

  it("marks curated competitive imports as multiplayer and competitive", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 304930, name: "Unturned" });

    expect(row.modes).toEqual(["單人", "多人", "競技"]);
  });

  it("marks curated short-session imports as short", () => {
    const row = toCatalogRow({ ...sampleSteamGame, appId: 501300, name: "What Remains of Edith Finch" });

    expect(row.session).toBe("short");
  });
});
