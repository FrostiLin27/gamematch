import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server credentials are not configured");

const supportByAppId = {
  1086940: [true, true, false], 1091500: [true, true, false], 1151340: [true, true, false], 1151640: [true, true, false],
  1205520: [false, false, false], 1238840: [true, false, false], 1245620: [true, true, false], 1272080: [true, true, false],
  1544020: [false, false, false], 1593500: [true, true, false], 1659040: [true, true, false], 1824220: [true, false, false],
  1938090: [true, true, false], 2050650: [true, true, false], 208650: [false, false, false], 218620: [false, false, false],
  2215430: [true, true, false], 225540: [false, false, false], 238010: [false, false, false], 2767030: [true, true, false],
  289690: [false, false, false], 292030: [true, true, false], 319630: [false, false, false], 360430: [true, true, false],
  397540: [true, true, false], 409710: [false, false, false], 409720: [false, false, false], 418370: [true, true, false],
  460930: [true, true, false], 480490: [true, true, false], 489830: [true, true, false], 553850: [true, true, false],
  578080: [true, false, false], 578650: [false, false, false], 6860: [false, false, false], 870780: [true, true, false],
  883710: [true, true, false],
};

const languageLists = {
  1284210: ["英文", "法文", "德文", "西班牙文 - 西班牙"],
  1286830: ["英文", "法文", "德文"],
  1677740: ["英文", "法文", "義大利文", "德文", "西班牙文 - 西班牙", "波蘭文", "葡萄牙文 - 葡萄牙", "葡萄牙文 - 巴西", "俄文", "日文", "韓文", "印尼語", "西班牙文 - 拉丁美洲"],
  2051620: ["英文", "法文", "德文", "日文", "韓文", "波蘭文", "俄文", "簡體中文", "西班牙文 - 拉丁美洲"],
};

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const supportUpdates = Object.entries(supportByAppId).map(([appId, [traditional_chinese_interface, traditional_chinese_subtitles, traditional_chinese_voice]]) => ({
  appId,
  patch: { traditional_chinese_interface, traditional_chinese_subtitles, traditional_chinese_voice },
}));
const languageUpdates = Object.entries(languageLists).map(([appId, languages]) => ({ appId, patch: { languages } }));
const updates = [...supportUpdates, ...languageUpdates];
const results = await Promise.all(updates.map(async ({ appId, patch }) => {
  const { error } = await client.from("games").update(patch).eq("source", "steam").eq("external_id", appId);
  return error ? { appId, error: error.message } : null;
}));
const failures = results.filter(Boolean);
console.log(JSON.stringify({ verifiedSupportRows: supportUpdates.length, languageListsUpdated: languageUpdates.length, updated: updates.length - failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
