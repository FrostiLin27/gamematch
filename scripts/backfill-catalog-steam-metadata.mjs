import { createClient } from "@supabase/supabase-js";

// Catalog/manual entries that have a verified Steam release.
const steamApps = {
  "a-short-hike": 1055540,
  "dave-diver": 1868140,
  "dead-cells": 588650,
  "deep-rock": 548430,
  "disco-elysium": 632470,
  dorfromantik: 1455840,
  firewatch: 383870,
  gris: 683320,
  hades: 1145360,
  "hard-baba-is-you": 736260,
  "hard-cuphead": 268910,
  "hard-devil-daggers": 422970,
  "hard-getting-over-it": 240720,
  "hard-jump-king": 1061090,
  "hard-nioh-2": 1325200,
  "hard-rain-world": 312520,
  "hard-sifu": 2138710,
  "hard-spelunky-2": 418530,
  "hard-super-meat-boy": 40800,
  "hollow-knight": 367520,
  inscryption: 1092790,
  "it-takes-two": 1426210,
  "mini-motorways": 1127500,
  "outer-wilds": 753640,
  "overcooked-2": 728880,
  phasmophobia: 739630,
  "portal-2": 620,
  "slay-spire": 646570,
  "slime-rancher": 433340,
  spiritfarer: 972660,
  stardew: 413150,
  terraria: 105600,
  unpacking: 1135690,
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase 管理員環境變數未設定");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function getSteamDetails(appId) {
  const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=tchinese&cc=tw`, {
    headers: { accept: "application/json", "user-agent": "game-match-steam-metadata-backfill/1.0" },
  });
  if (!response.ok) throw new Error(`Steam API HTTP ${response.status}`);
  const payload = await response.json();
  const result = payload[String(appId)];
  if (!result?.success || result.data?.type !== "game") throw new Error("Steam 遊戲資料不存在");
  const releaseDate = result.data.release_date?.date?.trim() || "";
  return {
    steam_url: `https://store.steampowered.com/app/${appId}/`,
    release_date: releaseDate || null,
  };
}

async function main() {
  const ids = Object.keys(steamApps);
  const { data: rows, error: readError } = await supabase
    .from("games")
    .select("id,source,name_zh,steam_url,release_date")
    .in("id", ids)
    .order("id");
  if (readError) throw readError;

  const rowById = new Map((rows ?? []).map((row) => [row.id, row]));
  const results = [];
  for (const id of ids) {
    const row = rowById.get(id);
    if (!row) {
      results.push({ id, source: "failed", error: "資料庫找不到對應遊戲" });
      continue;
    }
    try {
      const appId = steamApps[id];
      const metadata = await getSteamDetails(appId);
      results.push({ id, name: row.name_zh, appId, ...metadata });
    } catch (error) {
      results.push({ id, name: row.name_zh, appId: steamApps[id], source: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  const failed = results.filter((item) => item.source === "failed" || !item.release_date);
  const successful = results.filter((item) => item.source !== "failed" && item.release_date);
  console.log(JSON.stringify({ requested: ids.length, successful: successful.length, failed: failed.length, results }, null, 2));
  if (failed.length > 0) {
    console.error("有 Steam 欄位無法確認，為避免部分寫入，本次不更新資料庫。");
    process.exitCode = 2;
    return;
  }
  if (!process.argv.includes("--apply")) return;

  for (const item of successful) {
    const { error } = await supabase
      .from("games")
      .update({ steam_url: item.steam_url, release_date: item.release_date })
      .eq("id", item.id)
      .is("steam_url", null)
      .is("release_date", null);
    if (error) throw error;
  }
  console.log(JSON.stringify({ applied: successful.length }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
