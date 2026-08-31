import { createClient } from "@supabase/supabase-js";

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

const wikiTitles = {
  "mobile-arena-of-valor": "Arena of Valor",
  "mobile-genshin-impact": "Genshin Impact",
  "mobile-honkai-star-rail": "Honkai: Star Rail",
  "mobile-league-of-legends-wild-rift": "League of Legends: Wild Rift",
  "mobile-pokemon-go": "Pokémon Go",
  "playstation-astro-bot": "Astro Bot (2024 video game)",
  "playstation-astros-playroom": "Astro's Playroom",
  "playstation-bloodborne": "Bloodborne",
  "playstation-demons-souls": "Demon's Souls (2020 video game)",
  "playstation-gran-turismo-7": "Gran Turismo 7",
  "playstation-gravity-rush-2": "Gravity Rush 2",
  "playstation-infamous-second-son": "Infamous Second Son",
  "playstation-killzone-shadow-fall": "Killzone: Shadow Fall",
  "playstation-shadow-of-the-colossus": "Shadow of the Colossus (2018 video game)",
  "playstation-the-last-guardian": "The Last Guardian",
  "switch-animal-crossing-new-horizons": "Animal Crossing: New Horizons",
  "switch-fire-emblem-three-houses": "Fire Emblem: Three Houses",
  "switch-mario-kart-8-deluxe": "Mario Kart 8 Deluxe",
  "switch-splatoon-3": "Splatoon 3",
  "switch-super-mario-bros-wonder": "Super Mario Bros. Wonder",
  "switch-super-mario-odyssey": "Super Mario Odyssey",
  "switch-super-smash-bros-ultimate": "Super Smash Bros. Ultimate",
  "switch-xenoblade-chronicles-3": "Xenoblade Chronicles 3",
  "switch-zelda-breath-of-the-wild": "The Legend of Zelda: Breath of the Wild",
  "switch-zelda-tears-of-the-kingdom": "The Legend of Zelda: Tears of the Kingdom",
  minecraft: "Minecraft",
  valorant: "Valorant",
};

const directCovers = {
  minecraft: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/About-Minecraft_Featured-Image-0_570x321.jpg",
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 未設定`);
  return value;
}

async function jsonFetch(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "game-match-cover-backfill/1.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function steamCover(appId) {
  const payload = await jsonFetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`);
  const details = payload[String(appId)];
  if (!details?.success || typeof details.data?.header_image !== "string" || !details.data.header_image) {
    throw new Error("Steam 沒有可用的官方圖片");
  }
  return details.data.header_image;
}

async function wikipediaCover(title) {
  const encodedTitle = encodeURIComponent(title.replaceAll(" ", "_"));
  try {
    const page = await jsonFetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`);
    const image = page.originalimage?.source || page.thumbnail?.source;
    if (typeof image === "string" && image) return image;
  } catch {
    // The REST endpoint may briefly rate-limit, while the canonical page still works.
  }
  const response = await fetch(`https://en.wikipedia.org/wiki/${encodedTitle}`, {
    headers: { "user-agent": "game-match-cover-backfill/1.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  const match = html.match(/property="og:image"\s+content="([^"]+)"/i);
  const image = match?.[1]?.replaceAll("&amp;", "&");
  if (!image) throw new Error("頁面沒有封面圖片");
  return image;
}

async function main() {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: games, error: readError } = await supabase
    .from("games")
    .select("id,source,name_zh,name_en,cover_url")
    .in("source", ["catalog", "manual"])
    .is("cover_url", null)
    .order("id");
  if (readError) throw readError;

  const results = [];
  for (const game of games ?? []) {
    try {
      const appId = steamApps[game.id];
      const coverUrl = directCovers[game.id] || (appId ? await steamCover(appId) : await wikipediaCover(wikiTitles[game.id]));
      results.push({ id: game.id, name: game.name_zh, source: directCovers[game.id] ? "official" : appId ? "steam" : "wikipedia", coverUrl });
    } catch (error) {
      results.push({ id: game.id, name: game.name_zh, source: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  const failed = results.filter((item) => item.source === "failed");
  const successful = results.filter((item) => item.source !== "failed");
  console.log(JSON.stringify({ requested: games?.length ?? 0, successful: successful.length, failed: failed.length, results }, null, 2));
  if (failed.length > 0) process.exitCode = 2;
  if (process.argv.includes("--apply") && failed.length === 0) {
    for (const item of successful) {
      const { error } = await supabase
        .from("games")
        .update({ cover_url: item.coverUrl })
        .eq("id", item.id)
        .is("cover_url", null);
      if (error) throw error;
    }
    console.log(JSON.stringify({ applied: successful.length }, null, 2));
  } else if (process.argv.includes("--apply")) {
    console.error("有封面來源失敗，為避免部分寫入，本次不更新資料庫。");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
