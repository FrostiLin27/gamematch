import type { Game } from "./games";
import { difficultyOptions, games, genreOptions, languageOptions, modeOptions, moodOptions, platformOptions, sessionOptions } from "./games";

export type Preferences = {
  genres: string[];
  moods: string[];
  modes: string[];
  session: string;
  difficulty: string;
  platforms: string[];
  language: (typeof languageOptions)[number][];
  budget: "free" | "paid" | "any";
  avoid: string[];
};

export type HistoryItem = {
  gameId: string;
  status: "disliked" | "neutral" | "liked";
  rating: number;
  favorite: boolean;
  updatedAt: string;
};

export const emptyPreferences: Preferences = {
  genres: [], moods: [], modes: [], session: "", difficulty: "", platforms: [], language: ["語言不限"], budget: "any", avoid: [],
};

export const avoidOptions = [...genreOptions, ...moodOptions, ...modeOptions];

const sessionValues = sessionOptions.map((item) => item.value);
const difficultyValues = difficultyOptions.map((item) => item.value);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function allowedStringArray(value: unknown, allowed: readonly string[]) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && allowed.includes(item)))];
}

function allowedString(value: unknown, allowed: readonly string[], fallback: string) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function normalizeLanguage(value: unknown): Preferences["language"] {
  const values = allowedStringArray(value, languageOptions) as Preferences["language"];
  const traditionalChineseChoices = values.filter((item) => item !== "語言不限");
  return traditionalChineseChoices.length ? traditionalChineseChoices : ["語言不限"];
}

/**
 * Keeps both the local parser and an eventual AI response inside the values
 * understood by the recommendation engine. The server calls this before
 * returning AI output, and the client can use it as a final defensive guard.
 */
export function normalizePreferences(value: unknown): Preferences {
  const input = isRecord(value) ? value : {};
  return {
    genres: allowedStringArray(input.genres, genreOptions),
    moods: allowedStringArray(input.moods, moodOptions),
    modes: allowedStringArray(input.modes, modeOptions),
    session: allowedString(input.session, sessionValues, ""),
    difficulty: allowedString(input.difficulty, difficultyValues, ""),
    platforms: allowedStringArray(input.platforms, platformOptions),
    language: normalizeLanguage(input.language),
    budget: allowedString(input.budget, ["free", "paid", "any"], "any") as Preferences["budget"],
    avoid: allowedStringArray(input.avoid, avoidOptions),
  };
}

const overlap = (wanted: string[], actual: string[]) => wanted.filter((item) => actual.includes(item)).length;

type TraditionalChinesePreference = Exclude<(typeof languageOptions)[number], "語言不限">;

function supportsTraditionalChinese(game: Game, preference: TraditionalChinesePreference) {
  if (preference === "需要繁體中文介面") return game.traditionalChineseInterface ?? game.languages.includes("繁體中文");
  if (preference === "需要繁體中文字幕") return game.traditionalChineseSubtitles ?? game.languages.includes("繁體中文");
  return game.traditionalChineseVoice ?? false;
}

function languagePreferenceLabels(game: Game, preferences: Preferences) {
  return preferences.language
    .filter((item): item is TraditionalChinesePreference => item !== "語言不限")
    .filter((item) => supportsTraditionalChinese(game, item));
}

export function recommendGames(preferences: Preferences, history: HistoryItem[] = [], limit = 4, catalog: Game[] = games) {
  const historyMap = new Map(history.map((item) => [item.gameId, item]));
  return catalog
    .map((game) => ({ game, score: scoreGame(game, preferences, historyMap.get(game.id)) }))
    .filter(({ score }) => score > -30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ game, score }) => ({ game, score, reason: buildReason(game, preferences) }));
}

function scoreGame(game: Game, preferences: Preferences, history?: HistoryItem) {
  let score = 0;
  score += overlap(preferences.genres, game.genres) * 28;
  score += overlap(preferences.moods, game.moods) * 22;
  score += overlap(preferences.modes, game.modes) * 24;
  if (preferences.session && game.session === preferences.session) score += 18;
  if (preferences.difficulty && game.difficulty === preferences.difficulty) score += 10;
  score += overlap(preferences.platforms, game.platforms) * 12;
  const requestedLanguages = preferences.language.filter((item): item is TraditionalChinesePreference => item !== "語言不限");
  if (requestedLanguages.length) score += requestedLanguages.every((item) => supportsTraditionalChinese(game, item)) ? 16 : -12;
  if (preferences.budget === "free") score += game.priceType === "free" ? 18 : -10;
  if (preferences.budget === "paid") score += game.priceType === "paid" ? 5 : -4;
  score -= overlap(preferences.avoid, [...game.genres, ...game.moods, ...game.artStyle]) * 40;
  if (history?.status === "disliked") score -= 100;
  if (history?.status === "liked") score -= 12;
  if (history?.status === "neutral") score -= 35;
  if (history?.favorite) score -= 80;
  // A small deterministic exploration nudge prevents a tie from always feeling identical.
  score += (game.id.length % 7) * 0.1;
  return score;
}

function buildReason(game: Game, preferences: Preferences) {
  const matched: string[] = [];
  if (overlap(preferences.genres, game.genres)) matched.push(`${game.genres.find((item) => preferences.genres.includes(item))}口味`);
  if (overlap(preferences.moods, game.moods)) matched.push(`${game.moods.find((item) => preferences.moods.includes(item))}的氛圍`);
  if (overlap(preferences.modes, game.modes)) matched.push(`${game.modes.find((item) => preferences.modes.includes(item))}遊玩`);
  const matchedLanguages = languagePreferenceLabels(game, preferences);
  if (matchedLanguages.length) matched.push(matchedLanguages.map((item) => item.replace(/^需要/, "")).join("、"));
  if (preferences.session && game.session === preferences.session) matched.push("符合你的遊玩節奏");
  if (matched.length === 0) return `這款作品的${game.genres[0]}體驗很適合拿來探索新的遊戲旅程。`;
  return `因為你提到${matched.slice(0, 3).join("、")}，${game.nameZh}會是很值得點亮的一款遊戲。`;
}

const keywordGroups: Array<{ field: "genres" | "moods"; label: string; keywords: string[] }> = [
  { field: "genres", label: "動作", keywords: ["動作", "action"] },
  { field: "genres", label: "冒險", keywords: ["冒險", "探險", "adventure"] },
  { field: "genres", label: "角色扮演", keywords: ["角色扮演", "RPG"] },
  { field: "genres", label: "模擬", keywords: ["模擬", "經營", "simulation"] },
  { field: "genres", label: "解謎", keywords: ["解謎", "益智", "puzzle"] },
  { field: "genres", label: "策略", keywords: ["策略", "卡牌", "strategy"] },
  { field: "genres", label: "恐怖", keywords: ["恐怖", "驚嚇", "嚇人", "horror"] },
  { field: "genres", label: "生存", keywords: ["生存", "survival"] },
  { field: "genres", label: "射擊", keywords: ["射擊", "FPS", "槍戰", "shooter"] },
  { field: "genres", label: "休閒", keywords: ["休閒", "casual"] },
  { field: "genres", label: "建造", keywords: ["建造", "蓋房子", "building"] },
  { field: "moods", label: "放鬆", keywords: ["放鬆", "療癒", "舒服", "relax"] },
  { field: "moods", label: "刺激", keywords: ["刺激", "爽快", "熱血", "exciting"] },
  { field: "moods", label: "療癒", keywords: ["療癒", "可愛", "溫暖", "cozy"] },
  { field: "moods", label: "黑暗", keywords: ["黑暗", "陰鬱", "dark"] },
  { field: "moods", label: "幽默", keywords: ["幽默", "好笑", "搞笑", "humor"] },
  { field: "moods", label: "沉浸", keywords: ["沉浸", "故事感", "敘事", "immersive"] },
  { field: "moods", label: "緊張", keywords: ["緊張", "壓迫", "tense"] },
  { field: "moods", label: "探索", keywords: ["探索", "未知", "explore"] },
];

function includesKeyword(text: string, keyword: string) {
  return keyword.toLowerCase().split("|").some((part) => text.toLowerCase().includes(part));
}

function addUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

export function parseFreeText(text: string): Preferences {
  const result: Preferences = { ...emptyPreferences, genres: [], moods: [], modes: [], platforms: [], avoid: [] };
  for (const rule of keywordGroups) {
    if (rule.keywords.some((keyword) => includesKeyword(text, keyword))) addUnique(result[rule.field], rule.label);
  }
  if (/自己|一個人|單人|solo/i.test(text)) addUnique(result.modes, "單人");
  if (/朋友|一起|合作|多人|co-op|coop/i.test(text)) addUnique(result.modes, "合作");
  if (/多人|連線|線上|online/i.test(text)) addUnique(result.modes, "多人");
  if (/競技|對戰|ranked|PVP/i.test(text)) addUnique(result.modes, "競技");
  if (/短|一下|半小時|零碎/.test(text)) result.session = "short";
  else if (/很久|長時間|沉浸|一整晚/.test(text)) result.session = "long";
  else if (/一小時|一晚/.test(text)) result.session = "medium";
  if (/簡單|不難|新手|輕鬆/.test(text)) result.difficulty = "easy";
  else if (/困難|硬核|挑戰/.test(text)) result.difficulty = "hard";
  if (/Switch|NS|任天堂/i.test(text)) result.platforms.push("Switch");
  if (/手機|mobile|iOS|Android/i.test(text)) result.platforms.push("Mobile");
  if (/PlayStation|PS5|PS4/i.test(text)) result.platforms.push("PlayStation");
  if (/Xbox/i.test(text)) result.platforms.push("Xbox");
  if (/電腦|PC|Steam/i.test(text)) result.platforms.push("PC");
  if (/字幕/.test(text)) result.language = ["需要繁體中文字幕"];
  else if (/語音|配音/.test(text)) result.language = ["需要繁體中文語音"];
  else if (/介面|界面|UI/i.test(text)) result.language = ["需要繁體中文介面"];
  else if (/繁中|中文|繁體/.test(text)) result.language = ["需要繁體中文介面"];
  if (/免費|不要錢/.test(text)) result.budget = "free";

  const negativeFragments = [...text.matchAll(/(?:不要|不想|避開|不喜歡|不希望)([^。！？,，]*)/g)].map((match) => match[1]);
  const avoidanceRules: Array<[string, RegExp]> = [
    ["恐怖", /恐怖|驚嚇|嚇人/],
    ["射擊", /射擊|槍戰|FPS/],
    ["動作", /動作|打鬥/],
    ["競技", /競技|對戰|PVP/],
    ["多人", /多人|連線|線上/],
  ];
  for (const [tag, pattern] of avoidanceRules) {
    if (negativeFragments.some((fragment) => pattern.test(fragment))) addUnique(result.avoid, tag);
  }
  result.genres = result.genres.filter((tag) => !result.avoid.includes(tag));
  result.moods = result.moods.filter((tag) => !result.avoid.includes(tag));
  result.modes = result.modes.filter((tag) => !result.avoid.includes(tag));
  return normalizePreferences(result);
}
