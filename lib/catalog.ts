import type { Game } from "./games";

export type DatabaseGame = {
  id: string;
  name_zh: string;
  name_en: string;
  description: string;
  genres: string[];
  moods: string[];
  modes: string[];
  session: Game["session"];
  difficulty: Game["difficulty"];
  art_style: string[];
  platforms: string[];
  price_type: Game["priceType"];
  price_range: string;
  languages: string[];
  traditional_chinese_interface: boolean;
  traditional_chinese_subtitles: boolean;
  traditional_chinese_voice: boolean;
  cover: string;
  cover_class: string;
  featured: boolean;
  source: "catalog" | "manual" | "steam" | "igdb";
  external_id: string | null;
  cover_url: string | null;
  steam_url: string | null;
  release_date: string | null;
  metacritic_score: number | null;
};

function textArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isSession(value: unknown): value is Game["session"] {
  return value === "short" || value === "medium" || value === "long";
}

function isDifficulty(value: unknown): value is Game["difficulty"] {
  return value === "easy" || value === "medium" || value === "hard";
}

function isPriceType(value: unknown): value is Game["priceType"] {
  return value === "free" || value === "paid";
}

/** Converts the snake_case Supabase row into the UI's existing Game shape. */
export function mapDatabaseGame(value: unknown): Game | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<DatabaseGame>;
  if (
    typeof row.id !== "string" ||
    typeof row.name_zh !== "string" ||
    typeof row.name_en !== "string" ||
    typeof row.description !== "string" ||
    !isSession(row.session) ||
    !isDifficulty(row.difficulty) ||
    !isPriceType(row.price_type)
  ) return null;

  return {
    id: row.id,
    nameZh: row.name_zh,
    nameEn: row.name_en,
    description: row.description,
    genres: textArray(row.genres),
    moods: textArray(row.moods),
    modes: textArray(row.modes),
    session: row.session,
    difficulty: row.difficulty,
    artStyle: textArray(row.art_style),
    platforms: textArray(row.platforms),
    priceType: row.price_type,
    priceRange: typeof row.price_range === "string" ? row.price_range : "",
    languages: textArray(row.languages),
    traditionalChineseInterface: row.traditional_chinese_interface === true,
    traditionalChineseSubtitles: row.traditional_chinese_subtitles === true,
    traditionalChineseVoice: row.traditional_chinese_voice === true,
    cover: typeof row.cover === "string" ? row.cover : "✦",
    coverClass: typeof row.cover_class === "string" ? row.cover_class : "cover-sunset",
    featured: row.featured === true,
    source: row.source,
    externalId: row.external_id ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    steamUrl: row.steam_url ?? undefined,
    releaseDate: row.release_date ?? undefined,
    metacriticScore: typeof row.metacritic_score === "number" ? row.metacritic_score : null,
  };
}
