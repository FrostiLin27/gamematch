import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server credentials are not configured");

const games = [
  {
    id: "steam-2051620", external_id: "2051620", name_zh: "Enlisted", name_en: "Enlisted",
    description: "在《Enlisted》，你的部下不是只有一名士兵，而是要指揮整支小隊！這款小隊制大型多人線上射擊遊戲將 20 世紀最血腥戰爭的關鍵戰役重現眼前，每場戰鬥都有數百名士兵、坦克與戰機參與。",
    genres: ["動作", "射擊"], moods: ["刺激", "緊張"], modes: ["多人", "競技"], session: "medium", difficulty: "medium",
    traditional_chinese_interface: false, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2051620/3e5b05e2bb826d5e63af5c16c77b6c1396ad75b9/capsule_616x353.jpg?t=1783665086", release_date: "2024 年 7 月 17 日",
  },
  {
    id: "steam-1449850", external_id: "1449850", name_zh: "Yu-Gi-Oh! Master Duel", name_en: "Yu-Gi-Oh! Master Duel",
    description: "史上最強的數位卡牌遊戲！",
    genres: ["策略", "休閒"], moods: ["刺激", "沉浸"], modes: ["單人", "多人", "競技"], session: "medium", difficulty: "medium",
    traditional_chinese_interface: true, traditional_chinese_subtitles: true, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1449850/88fd770f77ae66d7599b548343325be6cdb05de0/capsule_616x353.jpg?t=1788064919", release_date: "2022 年 1 月 19 日",
  },
  {
    id: "steam-1665460", external_id: "1665460", name_zh: "eFootball™", name_en: "eFootball™",
    description: "齊來體驗下載數逾 10 億的刺激足球遊戲！與世界各地的玩家一起玩 eFootball™！",
    genres: ["模擬", "休閒"], moods: ["刺激"], modes: ["多人", "競技"], session: "medium", difficulty: "medium",
    traditional_chinese_interface: true, traditional_chinese_subtitles: false, traditional_chinese_voice: true,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1665460/3d7cad698741287226458a67e9b8f3fede2ba154/capsule_616x353.jpg?t=1787619924", release_date: "2021 年 9 月 30 日",
  },
  {
    id: "steam-438100", external_id: "438100", name_zh: "VRChat", name_en: "VRChat",
    description: "加入不斷成長的社群，探索、遊玩並協助打造社交 VR 的未來。創造世界與自訂化身，歡迎來到 VRChat。",
    genres: ["冒險", "休閒", "模擬"], moods: ["探索", "放鬆"], modes: ["多人"], session: "long", difficulty: "easy",
    traditional_chinese_interface: true, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/438100/capsule_616x353.jpg?t=1762366454", release_date: "2017 年 2 月 1 日",
  },
  {
    id: "steam-1568590", external_id: "1568590", name_zh: "Goose Goose Duck", name_en: "Goose Goose Duck",
    description: "《Goose Goose Duck》是一款最多支援 16 名玩家的社交推理遊戲。玩家會被分成不同小組，每組都有各自的目標。完成你們團隊的目標即可獲勝！",
    genres: ["休閒", "策略", "派對"], moods: ["幽默", "緊張"], modes: ["多人", "競技"], session: "short", difficulty: "medium",
    traditional_chinese_interface: true, traditional_chinese_subtitles: false, traditional_chinese_voice: true,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1568590/capsule_616x353.jpg?t=1778102536", release_date: "2021 年 10 月 4 日",
  },
  {
    id: "steam-1677740", external_id: "1677740", name_zh: "Stumble Guys", name_en: "Stumble Guys",
    description: "準備好迎接混亂了嗎？《Stumble Guys》是一款支援 32 名玩家、節奏快速的多人派對大逃殺遊戲。玩家要在搞笑的障礙賽道上衝刺、跳躍並跌跌撞撞前進，爭取成為最後留下的人。",
    genres: ["動作", "休閒", "派對"], moods: ["幽默", "刺激"], modes: ["多人", "競技"], session: "short", difficulty: "easy",
    traditional_chinese_interface: false, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1677740/capsule_616x353.jpg?t=1784624338", release_date: "2021 年 10 月 7 日",
  },
  {
    id: "steam-761890", external_id: "761890", name_zh: "阿爾比恩 Online", name_en: "Albion Online",
    description: "《阿爾比恩 Online》是一款奇幻風格的沙盒類 MMORPG，主打玩家主導的經濟發展、無職業戰鬥系統，以及酣暢淋漓的 PvP 戰鬥。探索一望無際且充滿危險和機會的開放世界，累積財富、建立聯盟，在《阿爾比恩》的世界留名青史吧。",
    genres: ["角色扮演", "冒險", "生存"], moods: ["探索", "沉浸"], modes: ["多人", "競技"], session: "long", difficulty: "medium",
    traditional_chinese_interface: true, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/761890/a4a69970df1cae25e4431906af30c9f367fc0c9c/capsule_616x353_alt_assets_2.jpg?t=1787224203", release_date: "2017 年 7 月 17 日",
  },
  {
    id: "steam-1407200", external_id: "1407200", name_zh: "《戰車世界》", name_en: "World of Tanks",
    description: "《戰車世界》是一款講究戰術的射擊遊戲，每輛車輛依類型與角色不同而有獨特玩法。除了常規的 PvP 戰鬥，另有競賽與公會模式，甚至是特殊的 PvE 與 PvPvE 活動與其他多元內容。無論您是想在戰場上征服對手，或就是喜愛戰車戰鬥，都能在當中暢享遊戲時光。",
    genres: ["動作", "射擊", "模擬"], moods: ["刺激", "緊張"], modes: ["多人", "競技"], session: "medium", difficulty: "medium",
    traditional_chinese_interface: true, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1407200/4b362e42794799edd2fa5dbe729b9a2f78c29ca2/capsule_616x353_alt_assets_23.jpg?t=1787737669", release_date: "2021 年 4 月 29 日",
  },
  {
    id: "steam-1284210", external_id: "1284210", name_zh: "Guild Wars 2®", name_en: "Guild Wars 2®",
    description: "《Guild Wars 2》是一款屢獲殊榮的線上角色扮演遊戲，具備快節奏動作戰鬥、深度角色自訂，且不需訂閱費。選擇職業與武器，探索廣闊開放世界，參與 PvP 模式等。立即加入超過 1,600 萬名玩家！",
    genres: ["角色扮演", "冒險"], moods: ["探索", "沉浸"], modes: ["多人"], session: "long", difficulty: "medium",
    traditional_chinese_interface: false, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1284210/9f7e5a2965f5bbf99cec82c798305a27967ac837/capsule_616x353.jpg?t=1782483330", release_date: "2022 年 8 月 24 日",
  },
  {
    id: "steam-1286830", external_id: "1286830", name_zh: "《星際大戰™：舊共和國™》", name_en: "Star Wars: The Old Republic",
    description: "《星際大戰™：舊共和國™》是可免費遊玩的大型多人線上角色扮演遊戲，讓你成為個人史詩劇情的焦點。在經典電影系列三千多年前的遙遠銀河系中，扮演絕地武士、西斯、賞金獵人，或是其他《星際大戰》的眾多經典角色。",
    genres: ["角色扮演", "冒險"], moods: ["沉浸", "探索"], modes: ["多人"], session: "long", difficulty: "medium",
    traditional_chinese_interface: false, traditional_chinese_subtitles: false, traditional_chinese_voice: false,
    cover_url: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1286830/capsule_616x353.jpg?t=1787234538", release_date: "2011 年 12 月 20 日",
  },
].map((game) => ({
  ...game,
  source: "steam",
  languages: game.traditional_chinese_interface || game.traditional_chinese_subtitles || game.traditional_chinese_voice ? ["繁體中文"] : [],
  platforms: ["PC"],
  art_style: [],
  price_type: "free",
  price_range: "免費遊玩",
  cover: "✦",
  cover_class: "cover-sunset",
  featured: false,
  steam_url: `https://store.steampowered.com/app/${game.external_id}/`,
  metacritic_score: null,
}));

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const ids = games.map((game) => game.external_id);
const { data: existing, error: existingError } = await client.from("games").select("external_id").eq("source", "steam").in("external_id", ids);
if (existingError) throw new Error(existingError.message);
const existingIds = new Set((existing || []).map((game) => game.external_id));
const pending = games.filter((game) => !existingIds.has(game.external_id));
if (pending.length) {
  const { error } = await client.from("games").insert(pending);
  if (error) throw new Error(error.message);
}
console.log(JSON.stringify({ selected: games.length, imported: pending.length, skippedExisting: games.length - pending.length, games: pending.map((game) => ({ appId: game.external_id, nameZh: game.name_zh })) }, null, 2));
