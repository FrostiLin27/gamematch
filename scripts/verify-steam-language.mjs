import fs from "node:fs/promises";

const inputPath = process.argv[2] || "/tmp/game-match-games.json";
const outputPath = process.argv[3] || "/tmp/game-match-steam-language-report.json";
const source = JSON.parse(await fs.readFile(inputPath, "utf8"));
const games = Array.isArray(source) ? source : [];
const appIds = [...new Set(games.map((game) => Number(game.external_id)).filter((id) => Number.isSafeInteger(id) && id > 0))];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLanguageSupport(value) {
  const raw = String(value || "");
  const text = stripHtml(raw);
  const match = /繁體中文|Chinese\s*\(Traditional\)/i.test(text);
  const fullAudio = /(?:繁體中文|Chinese\s*\(Traditional\))\s*\*/i.test(raw);
  return {
    traditionalChineseText: match,
    traditionalChineseVoice: fullAudio,
    supportedLanguages: text.split(",").map((item) => item.replace(/\*+$/g, "").trim()).filter(Boolean).slice(0, 20),
    rawSupportedLanguages: raw,
  };
}

async function fetchOne(appId) {
  let lastError = "unknown error";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=tchinese&cc=tw`, {
        headers: { accept: "application/json", "user-agent": "GameMatch catalog verifier/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const result = payload?.[String(appId)];
      if (!result?.success || !result.data || result.data.type !== "game") throw new Error("Steam returned no game details");
      const language = parseLanguageSupport(result.data.supported_languages);
      return {
        appId,
        nameZh: result.data.name || games.find((game) => Number(game.external_id) === appId)?.name_zh || `Steam ${appId}`,
        nameEn: undefined,
        ...language,
        ok: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await sleep(Math.min(30000, 1200 * 2 ** attempt));
    }
  }
  return { appId, ok: false, error: lastError };
}

const results = [];
const concurrency = 2;
for (let index = 0; index < appIds.length; index += concurrency) {
  const batch = appIds.slice(index, index + concurrency);
  results.push(...await Promise.all(batch.map(fetchOne)));
  const completed = Math.min(index + concurrency, appIds.length);
  console.error(`Steam language verification: ${completed}/${appIds.length}`);
  await sleep(600);
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "Steam Store appdetails API",
  apiLimitation: "supported_languages lists text languages and marks complete audio with *. It does not expose separate interface and subtitles columns; traditionalChineseText is therefore applied to both text columns.",
  total: results.length,
  successful: results.filter((item) => item.ok).length,
  failed: results.filter((item) => !item.ok).length,
  traditionalChineseText: results.filter((item) => item.ok && item.traditionalChineseText).length,
  traditionalChineseVoice: results.filter((item) => item.ok && item.traditionalChineseVoice).length,
  results,
};
await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  total: report.total,
  successful: report.successful,
  failed: report.failed,
  traditionalChineseText: report.traditionalChineseText,
  traditionalChineseVoice: report.traditionalChineseVoice,
  voiceGames: results.filter((item) => item.ok && item.traditionalChineseVoice).map((item) => ({ appId: item.appId, nameZh: item.nameZh })),
}, null, 2));
