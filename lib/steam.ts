const STEAM_STORE_ORIGIN = "https://store.steampowered.com";
const REQUEST_TIMEOUT_MS = 8000;

type SteamSearchItem = {
  type?: string;
  id?: number;
  name?: string;
  tiny_image?: string;
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
};

type SteamSearchResponse = { total?: number; items?: SteamSearchItem[] };

type SteamAppDetails = {
  type?: string;
  name?: string;
  steam_appid?: number;
  short_description?: string;
  header_image?: string;
  capsule_image?: string;
  supported_languages?: string;
  is_free?: boolean;
  price_overview?: { final_formatted?: string };
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  metacritic?: { score?: number };
  release_date?: { date?: string };
  genres?: Array<{ description?: string }>;
  categories?: Array<{ description?: string }>;
};

type SteamDetailsResponse = Record<string, { success?: boolean; data?: SteamAppDetails }>;

export type SteamGame = {
  appId: number;
  name: string;
  nameEn?: string;
  description: string;
  genres: string[];
  modes: string[];
  platforms: string[];
  priceType: "free" | "paid";
  priceRange: string;
  languages: string[];
  traditionalChineseInterface?: boolean;
  traditionalChineseSubtitles?: boolean;
  traditionalChineseVoice?: boolean;
  coverUrl: string;
  headerImage: string;
  steamUrl: string;
  releaseDate: string;
  metacriticScore: number | null;
};

/** Official Traditional Chinese names that Steam may not return in l=tchinese. */
const officialTraditionalNames: Record<number, string> = {
  620: "傳送門 2",
  730: "絕對武力 2",
  440: "絕地要塞 2",
  367520: "空洞騎士",
  1091500: "電馭叛客 2077",
  1145360: "黑帝斯",
  1145350: "黑帝斯 II",
  1174180: "碧血狂殺 2",
  1190460: "死亡擱淺",
  1222140: "底特律：變人",
  1817070: "漫威蜘蛛人：重製版",
  2050650: "惡靈古堡 4",
  239140: "垂死之光",
  275850: "無人深空",
  271590: "俠盜獵車手 V 傳承版",
  418370: "惡靈古堡 7 生化危機",
  374320: "黑暗靈魂 III",
  550: "惡靈勢力 2",
  447040: "看門狗 2",
  552500: "戰鎚：末世鼠疫 2",
  632470: "極樂迪斯科 - 最終剪輯",
  814380: "隻狼：暗影雙死",
  883710: "惡靈古堡 2",
  105600: "泰拉瑞亞",
  413150: "星露谷物語",
  448510: "煮過頭！",
  728880: "煮過頭！2",
  1088850: "漫威星際異攻隊",
  1151640: "地平線：期待黎明",
  1593500: "戰神",
  225540: "正當防衛 3",
  231430: "英雄連隊 2",
};

/** Steam occasionally ignores l=tchinese for descriptions; keep imported copy consistent. */
const traditionalDescriptionOverrides: Record<number, string> = {
  1150690: "探索一個充滿繽紛朋友與敵人的奇異世界。當時機到來，你所選擇的道路將決定你的命運……或許也決定其他人的命運。",
  1366540: "在太空模擬策略遊戲《戴森球計劃》中，打造效率最高的星際工廠！駕馭恆星的力量、收集資源、規劃並設計生產線，將你的星際工廠從小型太空工坊發展成遍布銀河的工業帝國。",
  1145360: "挑戰冥界之神，揮舞武器一路殺出冥界。這款迷宮探索型 Roguelike 動作遊戲由《堡壘》、《晶體管》和《Pyre》的開發團隊打造。",
  244850: "《太空工程師》是一款沙盒工程遊戲，讓你在完全可破壞的環境中設計並建造船艦、太空站與行星基地。探索行星與太空、開採資源、克服危險，並在創造或生存模式中獨自或與朋友並肩戰鬥。",
  1966720: "一款合作恐怖遊戲：在遭到遺棄的衛星上搜刮廢料，將其賣給公司。",
  219890: "《Antichamber》是一款令人費解的心理探索遊戲，在這裡沒有任何事物可以理所當然。探索如同埃舍爾畫作般的世界：走廊彼此環繞、空間不斷重新配置，而要前進，或許只能完成不可能的事。",
  255710: "《Cities: Skylines》是經典城市模擬遊戲的現代演繹。遊戲加入全新玩法，讓你體驗建立與維護一座真實城市的興奮與艱辛，同時拓展城市建設類型中許多深受喜愛的傳統元素。",
  252490: "在《Rust》中，唯一的目標就是生存。島上的野生動物、其他居民、環境，以及其他倖存者都想要你的命。想盡辦法撐過下一個夜晚。",
  253230: "《時光之帽》是一款可愛至極的 3D 平台跳躍遊戲，講述一位會縫製各種神奇帽子的小女孩與邪惡勢力較量的冒險故事！自由探索龐大的世界，找回遺失的時間碎片，開啟全新的旅途！",
  261570: "《精靈與森林之魂》講述一名注定成為英雄的年輕孤兒的故事；Moon Studios 以精美的視覺效果打造出這款動作平台遊戲，帶領玩家踏上旅程。",
  264710: "深入一個充滿奇觀與危險的外星水下世界。製作裝備、駕駛潛艇，並智取野生生物，探索繁茂的珊瑚礁、火山、洞穴系統等地，同時努力求生。",
  550: "在殭屍末日中，《惡靈勢力 2》是一款合作動作恐怖第一人稱射擊遊戲。你和朋友將穿越美國南方的城市、沼澤與墓地，從沙凡納一路前往紐奧良，體驗五個廣闊的戰役。",
  367520: "在《空洞騎士》中走出自己的道路！這是一場穿越廣闊昆蟲與英雄的殘破王國的史詩動作冒險。探索曲折洞穴、對抗受污染的生物，並以經典手繪 2D 風格結識奇異的昆蟲。",
  323190: "《Frostpunk》是第一款社會生存遊戲。身為地球上最後一座城市的統治者，你有責任管理市民與基礎設施。你會做出什麼決定來確保社會存續？當一切被逼到極限時，你會怎麼做？在這段過程中，你將成為什麼樣的人？",
  382310: "與真實玩家攜手建立文明、推動社會進步並阻止隕石，同時避免摧毀生態系統。",
  427520: "《Factorio》是一款關於建造與創造自動化工廠的遊戲，你將在無限延伸的 2D 世界中生產越來越複雜的物品。發揮想像力設計工廠，組合簡單元素打造巧妙結構，最後保護它們免受不喜歡你的生物侵襲。",
  648800: "《Raft》將你和朋友拋入一場史詩般的海洋冒險！獨自或攜手合作，在廣闊海域展開危險航程並努力生存。收集漂流物、搜刮礁石，建造屬於自己的漂浮家園，但要小心會吃人的鯊魚！",
  690830: "《Foundation》是一款沒有格線、步調悠閒的中世紀城市建造遊戲，專注於自然發展、紀念碑建造與資源管理。",
  892970: "一款支援 1～10 人的殘酷探索與生存遊戲，舞台是受維京文化啟發、由程序生成的煉獄。戰鬥、建造並征服這片土地，譜寫一段足以獲得奧丁庇佑的傳奇！",
  105600: "挖掘、戰鬥、探索、建造！在這款充滿動作的冒險遊戲中，沒有任何事是不可能的。另有四人套組可供選購！",
  218620: "《PAYDAY 2》是一款充滿動作的四人合作射擊遊戲。玩家將再次戴上原始 PAYDAY 劫匪團隊的面具，跟隨 Dallas、Hoxton、Wolf 與 Chains 前往華盛頓特區，展開一場史詩級犯罪狂歡。",
  252950: "《Rocket League》是街機風格足球與車輛混戰的高能混合體，操作容易上手，競賽流暢且由物理效果驅動。遊戲包含休閒與競技線上對戰、完整的離線賽季模式，以及能徹底改變規則的特殊變化器。",
  286160: "《Tabletop Simulator》是唯一能讓你透過掀桌發洩怒氣的模擬器！沒有必須遵守的規則，只有你、物理沙盒和朋友。製作自己的線上桌遊，或遊玩社群創作的數千款模組，享受無限的遊戲可能性！",
  291550: "最多支援 8 人線上或本機遊玩的史詩平台格鬥遊戲。你可以進行休閒混戰、排名賽，或邀請朋友進入私人房間，而且完全免費！與 PlayStation、Xbox、Nintendo Switch、iOS、Android 和 Steam 玩家跨平台遊玩。",
  322330: "《饑荒聯機版》是原生態生存遊戲《饑荒》的多人聯機獨立資料片。",
  4000: "《Garry's Mod》是一款物理沙盒遊戲，沒有預設的目標或玩法。我們提供工具，剩下的就交給你自由遊玩。",
  413150: "你繼承了祖父在星露谷的老舊農場。帶著祖傳工具和幾枚硬幣，你開始了新生活。你能學會靠土地生活，將雜草叢生的田地變成欣欣向榮的家園嗎？",
  448510: "《煮過頭！》是一款混亂的沙發合作烹飪遊戲，支援一至四名玩家。你和其他廚師必須團隊合作，在焦急的客人憤怒離場前準備、烹煮並端上各式美味餐點。",
  674940: "《Stick Fight》是一款以物理效果為基礎的本機／線上格鬥遊戲，你將化身網路黃金時代最具代表性的火柴人展開戰鬥。",
  225540: "在超過 1,000 平方公里、從天空延伸至海底的廣闊世界中，里科・羅德里格斯回歸，以最具創意、最爆炸性的方式掀起混亂。",
  231430: "體驗終極的《英雄連隊 2》二戰即時戰略平台，以及其獨立資料片。本套件包含基礎遊戲，之後還能購買《西線軍團》、《阿登突擊》及／或《英軍》。更多資訊請參閱下方的「關於這款遊戲」章節。",
  236110: "《Dungeon Defenders II》是一款合作動作塔防遊戲，並融入戰利品、升級與寵物等角色扮演元素。",
  244160: "體驗重新定義即時戰略類型的史詩級太空策略遊戲。控制你的艦隊，在超過 30 個單人任務中建立一支強大的太空艦隊。針對每種戰略情勢選擇單位類型、艦隊陣形與飛行戰術。",
  457140: "《缺氧》是一款太空殖民地模擬遊戲。在外星岩石深處，你勤奮的殖民者必須掌握科學、克服奇異的新生命，並運用驚人的太空科技求生，甚至繁榮發展。",
};

/** Building-focused games whose Steam genres do not expose the app's 建造 category. */
const buildingAppIds = new Set([
  294100, 427520, 255710, 949230, 1062090, 1366540, 975370, 1336490, 323190, 690830,
  244850, 382310, 648800, 1623730, 892970, 346110, 1326470, 1203620, 1604030, 1248130,
]);

/** Social and multiplayer games whose Steam genres do not expose the app's 派對 category. */
const partyAppIds = new Set([
  728880, 448510, 1260320, 880940, 945360, 252950, 1097150, 431240, 286160, 477160,
  322330, 413150, 105600, 218620, 381210, 629760, 386940, 674940, 291550, 4000,
]);

/** Curated multiplayer co-op games whose catalog entry should support both mode filters. */
const multiplayerCoopAppIds = new Set([
  548430, 553850, 2881650, 1361210, 1272080, 1222700, 1426210, 493520, 913740, 962130,
  1433140, 3241660, 1250, 238370, 690640, 1436700, 204360, 49520, 1509960, 582500,
]);

/** Curated competitive multiplayer games whose catalog entry should support both mode filters. */
const multiplayerCompetitiveAppIds = new Set([
  304930, 677620, 671860, 594650, 872200, 2073850, 2767030, 1422450, 611500, 504370,
  236390, 843380, 1824220, 976730, 552990, 1869590, 386180, 1203220, 444200, 282440,
]);

/** Curated short-session games that fit the UI's 30-minute play-time option. */
const shortSessionAppIds = new Set([
  501300, 384190, 557600, 1082430, 1122680, 1497450, 1049410, 303210, 1985690, 288160,
  499520, 702670, 1102130, 368370, 762830, 1122720, 785790, 1052990, 466630, 572890,
]);

/** Curated games suited to the UI's high-session / 1-day-plus play-time option. */
const longSessionAppIds = new Set([
  594570, 1142710, 1092790, 1593500, 1313140, 1151640, 460930, 1151340, 648350, 1088850,
  214950, 231430, 236110, 787860, 311690, 457140, 513710, 244160, 225540, 208650,
]);

/** Curated category memberships used when Steam's broad genres do not match the app's UI categories. */
const manualGenreAppIds: Record<string, Set<number>> = {
  模擬: new Set([294100, 427520, 255710, 949230, 1062090, 1366540, 975370, 1336490, 323190, 690830, 1248130, 1190970, 413150, 648800, 244850, 382310, 573090, 282070, 108600, 227300]),
  解謎: new Set([400, 620, 210970, 219890, 953490, 1293160, 1672970, 26800, 1455840, 237850, 1150690, 367520, 1057090, 261570, 383870, 1222140, 638230, 253230, 286160, 322330, 1985690]),
  策略: new Set([427520, 294100, 255710, 949230, 1336490, 323190, 690830, 975370, 282070, 8930, 289070, 281990, 236850, 394360, 268500, 200510, 960090, 2379780, 1248130, 1366540]),
  恐怖: new Set([1966720, 418370, 883710, 2050650, 381210, 739630, 238320, 414700, 214490, 57300, 319510, 700330, 221100, 251570, 1326470, 252490, 242760, 440900, 305620, 967050]),
  生存: new Set([252490, 221100, 346110, 892970, 264710, 648800, 1623730, 1326470, 251570, 1203620, 1604030, 239140, 322330, 105600, 275850, 108600, 440900, 305620, 242760, 573090]),
  射擊: new Set([730, 1172470, 578080, 440, 1938090, 1240440, 550, 218620, 286690, 412020, 230410, 359550, 252490, 221100, 377160, 1085660, 444090, 1237970, 1238810, 1517290]),
  休閒: new Set([728880, 448510, 1260320, 880940, 945360, 1097150, 431240, 286160, 477160, 413150, 386940, 674940, 291550, 4000, 105600, 960090, 252950, 322170, 1455840, 620]),
  敘事: new Set([383870, 1222140, 632470, 1174180, 1190460, 620, 1672970, 1057090, 261570, 367520, 282070, 292030, 377160, 1086940, 1091500, 1145360, 1145350, 2050650, 638230, 214490]),
  角色扮演: new Set([1091500, 1245620, 1145360, 1145350, 632470, 1150690, 239140, 1604030, 892970, 346110, 1623730, 1203620, 251570, 1086940, 292030, 377160, 72850, 22380, 582010, 1446780]),
};

/** Curated mood memberships for the eight selectable atmosphere options. */
const manualMoodAppIds: Record<string, Set<number>> = {
  放鬆: new Set([1290000, 1480560, 613100, 666140, 703080, 493340, 220200, 1222670, 420530, 972660, 1291340, 1454400, 1432860, 219740, 211820, 239800, 774171, 837470, 962580, 287980]),
  刺激: new Set([500, 236430, 335300, 205100, 48700, 397540, 1238840, 1229490, 1144200, 6860, 1659040, 632360, 588650, 815370, 552520, 939960, 423230, 20920, 20900, 360430]),
  療癒: new Set([683320, 1055540, 1458100, 990630, 729000, 1062520, 1574580, 1137750, 1337760, 1629520, 1359980, 1337010, 257510, 1307580, 715560, 2303350, 914800, 1663220, 1135690, 894940]),
  黑暗: new Set([4500, 41700, 17470, 47780, 952060, 253110, 424840, 860510, 1295920, 274520, 601430, 282140, 514900, 594330, 792300, 48000, 304430, 402020, 870780, 780290]),
  幽默: new Set([221910, 285900, 434170, 219150, 224480, 274190, 213670, 1703340, 3590, 362890, 265930, 327890, 1089980, 113200, 375820, 363970, 304050, 508440, 391540, 12200]),
  沉浸: new Set([1716740, 379430, 489830, 526870, 1172620, 612880, 874260, 1158310, 753640, 306130, 848450, 289690, 236090, 480490, 504230, 250900, 391220, 392160, 1465360, 1284190]),
  緊張: new Set([686810, 1250410, 1304930, 1544020, 752590, 519860, 409710, 409720, 7670, 238010, 268050, 222880, 2310, 232090, 379720, 365590, 433850, 916840, 738520, 692890]),
  探索: new Set([361420, 318600, 578650, 2215430, 990080, 812140, 973810, 33230, 289650, 311560, 375910, 365450, 291650, 435150, 373420, 560130, 296300, 63380, 319630, 881100]),
};

/** Mood labels for imported games whose Steam genres are too broad to infer atmosphere. */
const manualMoodOverrides: Record<number, string[]> = {
  1062090: ["放鬆", "沉浸", "探索"], 108600: ["黑暗", "緊張", "沉浸"], 1091500: ["黑暗", "刺激", "沉浸"],
  1151340: ["探索", "刺激", "沉浸"], 1190970: ["放鬆", "療癒", "沉浸"], 1248130: ["放鬆", "沉浸", "探索"],
  1282730: ["黑暗", "刺激", "沉浸"], 1336490: ["緊張", "沉浸", "探索"], 1366540: ["沉浸", "探索", "放鬆"],
  1455840: ["放鬆", "療癒", "探索"], 1601580: ["黑暗", "緊張", "沉浸"], 1985690: ["幽默", "探索", "沉浸"],
  200510: ["緊張", "刺激", "沉浸"], 212680: ["緊張", "探索", "沉浸"], 214950: ["沉浸", "探索", "緊張"],
  227300: ["放鬆", "沉浸", "探索"], 231430: ["緊張", "刺激", "沉浸"], 236850: ["沉浸", "探索", "緊張"],
  2379780: ["刺激", "沉浸", "幽默"], 244160: ["沉浸", "探索", "緊張"], 255710: ["放鬆", "沉浸", "探索"],
  262060: ["黑暗", "緊張", "沉浸"], 26800: ["沉浸", "探索"], 268500: ["緊張", "刺激", "沉浸"],
  281990: ["探索", "沉浸", "緊張"], 286160: ["幽默", "放鬆", "沉浸"], 289070: ["探索", "沉浸", "緊張"],
  292030: ["黑暗", "沉浸", "探索"], 294100: ["沉浸", "幽默", "緊張"], 319510: ["黑暗", "緊張", "沉浸"],
  323190: ["黑暗", "緊張", "沉浸"], 377160: ["探索", "沉浸", "刺激"], 394360: ["沉浸", "緊張", "探索"],
  4000: ["幽默", "探索", "放鬆"], 413150: ["放鬆", "療癒", "沉浸"], 427520: ["沉浸", "探索", "放鬆"],
  431240: ["放鬆", "幽默", "刺激"], 457140: ["緊張", "沉浸", "探索"], 573090: ["沉浸", "探索", "緊張"],
  590380: ["緊張", "刺激", "沉浸"], 632470: ["黑暗", "幽默", "沉浸"], 646570: ["沉浸", "刺激", "緊張"],
  648350: ["沉浸", "探索", "緊張"], 690830: ["放鬆", "沉浸", "探索"], 72850: ["探索", "沉浸", "刺激"],
  787860: ["放鬆", "沉浸", "探索"], 8930: ["探索", "沉浸", "緊張"], 913740: ["黑暗", "緊張", "沉浸"],
  945360: ["幽默", "緊張", "刺激"], 949230: ["放鬆", "沉浸", "探索"], 960090: ["幽默", "刺激", "緊張"],
  975370: ["沉浸", "探索", "緊張"],
};

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function platformLabels(platforms: SteamAppDetails["platforms"] | SteamSearchItem["platforms"]) {
  if (!platforms) return ["PC"];
  const labels: string[] = [];
  if (platforms.windows || platforms.mac || platforms.linux) labels.push("PC");
  return labels.length ? labels : ["PC"];
}

function parseLanguages(value: string | undefined) {
  if (!value) return [];
  return stripHtml(value)
    .split(",")
    .map((item) => item.replace(/\*+$/g, "").trim())
    .filter(Boolean)
    .slice(0, 12);
}

function parseTraditionalChineseSupport(value: string | undefined) {
  const normalized = stripHtml(value || "");
  const hasTraditionalChinese = /繁體中文|Chinese\s*\(Traditional\)/i.test(normalized);
  const hasTraditionalChineseVoice = /(?:繁體中文|Chinese\s*\(Traditional\))\s*\*/i.test(normalized);
  return {
    traditionalChineseInterface: hasTraditionalChinese,
    traditionalChineseSubtitles: hasTraditionalChinese,
    traditionalChineseVoice: hasTraditionalChineseVoice,
  };
}

function toSteamGame(appId: number, details: SteamAppDetails, fallback?: SteamSearchItem, englishName?: string): SteamGame {
  const isFree = details.is_free === true;
  const localizedName = details.name || fallback?.name || `Steam 遊戲 ${appId}`;
  const nameEnValue = englishName || details.name || fallback?.name || `Steam 遊戲 ${appId}`;
  const name = officialTraditionalNames[appId] || localizedName;
  const languageSupport = parseTraditionalChineseSupport(details.supported_languages);
  return {
    appId,
    name,
    nameEn: nameEnValue,
    description: traditionalDescriptionOverrides[appId] || stripHtml(details.short_description || ""),
    genres: [...new Set((details.genres ?? []).map((item) => item.description).filter((item): item is string => Boolean(item)))],
    modes: [...new Set((details.categories ?? []).map((item) => item.description).filter((item): item is string => item === "單人" || item === "多人" || item === "合作"))],
    platforms: platformLabels(details.platforms || fallback?.platforms),
    priceType: isFree ? "free" : "paid",
    priceRange: isFree ? "免費遊玩" : details.price_overview?.final_formatted || "Steam 商店價格",
    languages: parseLanguages(details.supported_languages),
    ...languageSupport,
    coverUrl: details.capsule_image || fallback?.tiny_image || "",
    headerImage: details.header_image || "",
    steamUrl: `https://store.steampowered.com/app/${appId}/`,
    releaseDate: details.release_date?.date || "",
    metacriticScore: typeof details.metacritic?.score === "number" ? details.metacritic.score : null,
  };
}

const steamGenreMap: Record<string, string> = {
  動作: "動作",
  冒險: "冒險",
  角色扮演: "角色扮演",
  模擬: "模擬",
  策略: "策略",
  解謎: "解謎",
  恐怖: "恐怖",
  生存: "生存",
  射擊: "射擊",
  休閒: "休閒",
  建造: "建造",
};

function catalogGenres(game: SteamGame) {
  const genres = game.genres.map((genre) => steamGenreMap[genre]).filter((genre): genre is string => Boolean(genre));
  if (buildingAppIds.has(game.appId)) genres.push("建造");
  if (partyAppIds.has(game.appId)) genres.push("派對");
  for (const [genre, appIds] of Object.entries(manualGenreAppIds)) {
    if (appIds.has(game.appId)) genres.push(genre);
  }
  return [...new Set(genres)];
}

function catalogMoods(game: SteamGame) {
  const moods: string[] = [];
  if (game.genres.includes("冒險")) moods.push("探索");
  if (game.genres.includes("動作") || game.genres.includes("射擊")) moods.push("刺激");
  if (game.genres.includes("恐怖")) moods.push("恐怖", "緊張");
  for (const [mood, appIds] of Object.entries(manualMoodAppIds)) {
    if (appIds.has(game.appId)) moods.push(mood);
  }
  moods.push(...(manualMoodOverrides[game.appId] ?? []));
  return [...new Set(moods)];
}

function catalogModes(game: SteamGame) {
  const modes = [...game.modes];
  if (multiplayerCoopAppIds.has(game.appId)) modes.push("多人", "合作");
  if (multiplayerCompetitiveAppIds.has(game.appId)) modes.push("多人", "競技");
  return [...new Set(modes)];
}

function catalogSession(game: SteamGame): "short" | "medium" | "long" {
  if (shortSessionAppIds.has(game.appId)) return "short";
  if (longSessionAppIds.has(game.appId)) return "long";
  return "medium";
}

/** Maps Steam data into the games table shape used by the recommendation engine. */
export function toCatalogRow(game: SteamGame) {
  return {
    id: `steam-${game.appId}`,
    source: "steam" as const,
    external_id: String(game.appId),
    name_zh: officialTraditionalNames[game.appId] || game.name,
    name_en: game.nameEn || game.name,
    description: traditionalDescriptionOverrides[game.appId] || game.description,
    genres: catalogGenres(game),
    moods: catalogMoods(game),
    modes: catalogModes(game),
    session: catalogSession(game),
    difficulty: "medium" as const,
    art_style: [],
    platforms: game.platforms,
    price_type: game.priceType,
    price_range: game.priceRange,
    languages: game.languages,
    traditional_chinese_interface: game.traditionalChineseInterface ?? game.languages.includes("繁體中文"),
    traditional_chinese_subtitles: game.traditionalChineseSubtitles ?? game.languages.includes("繁體中文"),
    traditional_chinese_voice: game.traditionalChineseVoice ?? false,
    cover: "✦",
    cover_class: "cover-sunset",
    featured: false,
    cover_url: game.coverUrl || null,
    steam_url: game.steamUrl,
    release_date: game.releaseDate || null,
    metacritic_score: game.metacriticScore,
  };
}

async function steamJson<T>(path: string): Promise<T> {
  const url = new URL(path, STEAM_STORE_ORIGIN);
  if (url.origin !== STEAM_STORE_ORIGIN) throw new Error("Invalid Steam URL");
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Steam API returned ${response.status}`);
  return (await response.json()) as T;
}

function responseText(payload: { output_text?: unknown; output?: unknown[] }) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const chunks = (payload.output ?? []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? [text] : [];
    });
  });
  return chunks.join("");
}

function hasChinese(value: string) {
  return /[\u3400-\u9fff]/u.test(value);
}

/** Translates an unlocalized Steam description when the optional server key exists. */
export async function translateSteamDescription(game: SteamGame): Promise<SteamGame> {
  if (!game.description || hasChinese(game.description) || !process.env.OPENAI_API_KEY) return game;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6",
        input: [
          { role: "system", content: "請將遊戲簡介忠實翻譯成臺灣繁體中文。保留遊戲名稱、專有名詞與原意，不要補充原文沒有的資訊，只輸出翻譯後的簡介。" },
          { role: "user", content: game.description },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "steam_description_translation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { description: { type: "string" } },
              required: ["description"],
            },
          },
        },
        max_output_tokens: 300,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return game;
    const payload = (await response.json()) as { output_text?: unknown; output?: unknown[] };
    const raw = responseText(payload);
    if (!raw) return game;
    const translated = JSON.parse(raw) as { description?: unknown };
    return typeof translated.description === "string" && translated.description.trim()
      ? { ...game, description: translated.description.trim() }
      : game;
  } catch {
    return game;
  }
}

export async function searchSteamGames(term: string, limit = 6) {
  const query = new URLSearchParams({ term, l: "tchinese", cc: "tw" });
  const response = await steamJson<SteamSearchResponse>(`/api/storesearch/?${query.toString()}`);
  const items = (response.items ?? []).filter((item) => item.type === "app" && typeof item.id === "number").slice(0, limit);

  const games = await Promise.all(items.map(async (item) => {
    try {
      return await getSteamGame(item.id!, item);
    } catch {
      return toSteamGame(item.id!, {}, item);
    }
  }));
  return { total: response.total ?? games.length, games };
}

export async function getSteamGame(appId: number, fallback?: SteamSearchItem) {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error("Invalid Steam app id");
  const response = await steamJson<SteamDetailsResponse>(`/api/appdetails?appids=${appId}&l=tchinese&cc=tw`);
  const result = response[String(appId)];
  if (!result?.success || !result.data || result.data.type !== "game") throw new Error("Steam game not found");
  let englishName: string | undefined;
  if (hasChinese(result.data.name || "")) {
    try {
      const englishResponse = await steamJson<SteamDetailsResponse>(`/api/appdetails?appids=${appId}&l=english&cc=us`);
      const englishData = englishResponse[String(appId)]?.data;
      englishName = englishData?.name;
    } catch {
      // Keep the localized name if Steam's English detail request is unavailable.
    }
  }
  return toSteamGame(appId, result.data, fallback, englishName);
}
