export type Game = {
  id: string;
  nameZh: string;
  nameEn: string;
  description: string;
  genres: string[];
  moods: string[];
  modes: string[];
  session: "short" | "medium" | "long";
  difficulty: "easy" | "medium" | "hard";
  artStyle: string[];
  platforms: string[];
  priceType: "free" | "paid";
  priceRange: string;
  languages: string[];
  traditionalChineseInterface?: boolean;
  traditionalChineseSubtitles?: boolean;
  traditionalChineseVoice?: boolean;
  cover: string;
  coverClass: string;
  featured?: boolean;
  source?: "catalog" | "manual" | "steam" | "igdb";
  externalId?: string;
  coverUrl?: string;
  steamUrl?: string;
  releaseDate?: string;
  metacriticScore?: number | null;
};

export const games: Game[] = [
  { id: "spiritfarer", nameZh: "Spiritfarer", nameEn: "Spiritfarer", description: "在一艘溫暖的船上陪伴靈魂，慢慢探索一個關於告別與友誼的手繪世界。", genres: ["冒險", "模擬"], moods: ["放鬆", "療癒", "沉浸"], modes: ["單人"], session: "medium", difficulty: "easy", artStyle: ["卡通", "手繪"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 500～700", languages: ["繁體中文"], cover: "✦", coverClass: "cover-sunset", featured: true },
  { id: "outer-wilds", nameZh: "星際拓荒", nameEn: "Outer Wilds", description: "乘著小小的太空船，追尋太陽系裡一個等待被解開的古老謎團。", genres: ["冒險", "解謎"], moods: ["探索", "沉浸", "神秘"], modes: ["單人"], session: "medium", difficulty: "medium", artStyle: ["低多邊形", "寫實"], platforms: ["PC", "PlayStation", "Xbox", "Switch"], priceType: "paid", priceRange: "約 NT$ 700～900", languages: ["繁體中文"], cover: "◌", coverClass: "cover-space" },
  { id: "stardew", nameZh: "星露谷物語", nameEn: "Stardew Valley", description: "繼承一座荒廢農場，種田、交朋友，照自己的步調過一段新的生活。", genres: ["模擬", "角色扮演"], moods: ["放鬆", "療癒", "幽默"], modes: ["單人", "合作"], session: "long", difficulty: "easy", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 400～500", languages: ["繁體中文"], cover: "♧", coverClass: "cover-farm" },
  { id: "hades", nameZh: "黑帝斯", nameEn: "Hades", description: "一次又一次從冥界突圍，在神祇與家族的故事裡享受流暢的動作戰鬥。", genres: ["動作", "角色扮演", "冒險"], moods: ["刺激", "緊張", "沉浸"], modes: ["單人"], session: "short", difficulty: "hard", artStyle: ["動漫", "手繪"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 700～900", languages: ["繁體中文"], cover: "♠", coverClass: "cover-underworld" },
  { id: "a-short-hike", nameZh: "A Short Hike", nameEn: "A Short Hike", description: "爬上山頂收訊號吧。沿途釣魚、飛行與認識旅伴，短短一段很舒服的旅程。", genres: ["冒險", "休閒"], moods: ["放鬆", "療癒", "探索"], modes: ["單人"], session: "short", difficulty: "easy", artStyle: ["像素", "卡通"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 200～300", languages: ["英文"], cover: "⌁", coverClass: "cover-hike" },
  { id: "portal-2", nameZh: "傳送門 2", nameEn: "Portal 2", description: "用傳送門和一點點幽默，解開一座古怪實驗室裡精巧又令人滿足的謎題。", genres: ["解謎", "冒險"], moods: ["幽默", "探索", "沉浸"], modes: ["單人", "合作"], session: "medium", difficulty: "medium", artStyle: ["寫實"], platforms: ["PC", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 300～500", languages: ["繁體中文"], cover: "◎", coverClass: "cover-portal" },
  { id: "dave-diver", nameZh: "潛水員戴夫", nameEn: "Dave the Diver", description: "白天潛入藍洞捕魚，晚上經營壽司店，一款節奏豐富又充滿驚喜的像素冒險。", genres: ["冒險", "模擬", "休閒"], moods: ["幽默", "探索", "放鬆"], modes: ["單人"], session: "medium", difficulty: "easy", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation"], priceType: "paid", priceRange: "約 NT$ 600～800", languages: ["繁體中文"], cover: "≋", coverClass: "cover-ocean" },
  { id: "inscryption", nameZh: "邪靈入侵", nameEn: "Inscryption", description: "一場不太對勁的牌局。解謎、卡牌與陰鬱敘事交織成意外深刻的冒險。", genres: ["策略", "解謎", "恐怖"], moods: ["黑暗", "神秘", "緊張"], modes: ["單人"], session: "medium", difficulty: "hard", artStyle: ["像素", "黑暗"], platforms: ["PC", "PlayStation", "Switch"], priceType: "paid", priceRange: "約 NT$ 500～700", languages: ["繁體中文"], cover: "☽", coverClass: "cover-cabin" },
  { id: "unpacking", nameZh: "Unpacking", nameEn: "Unpacking", description: "把物品放進新家，從熟悉的日常物件中拼出一個人的成長故事。", genres: ["解謎", "休閒", "模擬"], moods: ["放鬆", "療癒", "沉浸"], modes: ["單人"], session: "short", difficulty: "easy", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 400～600", languages: ["繁體中文"], cover: "▦", coverClass: "cover-room" },
  { id: "slay-spire", nameZh: "殺戮尖塔", nameEn: "Slay the Spire", description: "組出你的牌組，攀登一座每次都不一樣的尖塔，適合一局一局慢慢琢磨。", genres: ["策略", "角色扮演"], moods: ["沉浸", "刺激", "探索"], modes: ["單人"], session: "short", difficulty: "hard", artStyle: ["卡通"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 500～700", languages: ["繁體中文"], cover: "△", coverClass: "cover-spire" },
  { id: "it-takes-two", nameZh: "雙人成行", nameEn: "It Takes Two", description: "只有兩個人才能解開的合作關卡，一起度過一場充滿創意的關係修復之旅。", genres: ["冒險", "動作"], moods: ["幽默", "刺激", "療癒"], modes: ["合作", "多人"], session: "long", difficulty: "medium", artStyle: ["卡通"], platforms: ["PC", "PlayStation", "Xbox", "Switch"], priceType: "paid", priceRange: "約 NT$ 700～1,000", languages: ["繁體中文"], cover: "∞", coverClass: "cover-toy" },
  { id: "deep-rock", nameZh: "深岩銀河", nameEn: "Deep Rock Galactic", description: "和太空矮人隊友挖進危險星球，合作採礦、開槍，還要一起安全回家。", genres: ["動作", "射擊", "冒險"], moods: ["刺激", "幽默", "緊張"], modes: ["合作", "多人"], session: "medium", difficulty: "medium", artStyle: ["卡通"], platforms: ["PC", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 500～800", languages: ["繁體中文"], cover: "✹", coverClass: "cover-cave" },
  { id: "firewatch", nameZh: "看火人", nameEn: "Firewatch", description: "在壯闊森林裡擔任守林員，透過無線電與遠方的人建立一段特別的連結。", genres: ["冒險", "敘事"], moods: ["沉浸", "神秘", "放鬆"], modes: ["單人"], session: "short", difficulty: "easy", artStyle: ["寫實"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 500～700", languages: ["繁體中文"], cover: "◒", coverClass: "cover-forest" },
  { id: "hollow-knight", nameZh: "空洞騎士", nameEn: "Hollow Knight", description: "深入廣闊的地下王國，面對精準戰鬥與一個等待被發現的蒼涼傳說。", genres: ["動作", "冒險"], moods: ["黑暗", "探索", "沉浸"], modes: ["單人"], session: "long", difficulty: "hard", artStyle: ["手繪", "黑暗"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 400～600", languages: ["繁體中文"], cover: "◉", coverClass: "cover-hollow" },
  { id: "minecraft", nameZh: "Minecraft", nameEn: "Minecraft", description: "用方塊蓋出任何想像，獨自或和朋友一起在沒有邊界的世界裡生活。", genres: ["生存", "建造", "冒險"], moods: ["放鬆", "探索", "刺激"], modes: ["單人", "合作", "多人"], session: "long", difficulty: "medium", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 800～1,000", languages: ["繁體中文"], cover: "▦", coverClass: "cover-blocks" },
  { id: "dead-cells", nameZh: "重生細胞", nameEn: "Dead Cells", description: "在不斷變化的城堡中戰鬥與重生，快節奏、爽快又適合短時間挑戰。", genres: ["動作", "冒險"], moods: ["刺激", "緊張", "探索"], modes: ["單人"], session: "short", difficulty: "hard", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 600～800", languages: ["繁體中文"], cover: "⚔", coverClass: "cover-cells" },
  { id: "dorfromantik", nameZh: "Dorfromantik", nameEn: "Dorfromantik", description: "拼起一片片森林、河流與村莊，安靜地打造屬於自己的小小景色。", genres: ["策略", "休閒", "解謎"], moods: ["放鬆", "療癒", "探索"], modes: ["單人"], session: "short", difficulty: "easy", artStyle: ["低多邊形"], platforms: ["PC", "Switch"], priceType: "paid", priceRange: "約 NT$ 300～500", languages: ["繁體中文"], cover: "⌂", coverClass: "cover-village" },
  { id: "phasmophobia", nameZh: "恐鬼症", nameEn: "Phasmophobia", description: "拿起設備找出鬼魂的證據，和朋友在語音裡互相壯膽。", genres: ["恐怖", "冒險"], moods: ["恐怖", "緊張", "刺激"], modes: ["合作", "多人"], session: "medium", difficulty: "medium", artStyle: ["寫實", "黑暗"], platforms: ["PC", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 400～600", languages: ["繁體中文"], cover: "☠", coverClass: "cover-ghost" },
  { id: "overcooked-2", nameZh: "煮過頭 2", nameEn: "Overcooked! 2", description: "在會移動的廚房裡和朋友分工合作，混亂、歡樂，也很考驗默契。", genres: ["休閒", "派對", "模擬"], moods: ["幽默", "刺激", "緊張"], modes: ["合作", "多人"], session: "short", difficulty: "medium", artStyle: ["卡通"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 500～800", languages: ["繁體中文"], cover: "♨", coverClass: "cover-kitchen" },
  { id: "disco-elysium", nameZh: "極樂迪斯科", nameEn: "Disco Elysium", description: "扮演一名失憶警探，在城市裡調查案件，也和自己腦中的聲音交涉。", genres: ["角色扮演", "敘事", "解謎"], moods: ["黑暗", "幽默", "沉浸"], modes: ["單人"], session: "long", difficulty: "medium", artStyle: ["手繪"], platforms: ["PC", "PlayStation", "Xbox", "Switch"], priceType: "paid", priceRange: "約 NT$ 700～1,000", languages: ["繁體中文"], cover: "✎", coverClass: "cover-disco" },
  { id: "terraria", nameZh: "泰拉瑞亞", nameEn: "Terraria", description: "挖掘、建造、戰鬥與探索都由你決定，像一盒可以無限延伸的冒險玩具。", genres: ["生存", "建造", "冒險"], moods: ["探索", "刺激", "放鬆"], modes: ["單人", "合作", "多人"], session: "long", difficulty: "medium", artStyle: ["像素"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 300～500", languages: ["繁體中文"], cover: "⛏", coverClass: "cover-terraria" },
  { id: "mini-motorways", nameZh: "迷你公路", nameEn: "Mini Motorways", description: "用簡潔的線條規劃城市交通，看城市逐漸長大並保持流動。", genres: ["策略", "模擬"], moods: ["放鬆", "沉浸", "緊張"], modes: ["單人"], session: "short", difficulty: "medium", artStyle: ["低多邊形"], platforms: ["PC", "Switch", "Mobile"], priceType: "paid", priceRange: "約 NT$ 300～500", languages: ["繁體中文"], cover: "╱", coverClass: "cover-road" },
  { id: "gris", nameZh: "GRIS", nameEn: "GRIS", description: "在一幅會呼吸的水彩畫中前進，沒有死亡壓力，只有音樂、色彩與情緒。", genres: ["冒險", "解謎"], moods: ["療癒", "放鬆", "沉浸"], modes: ["單人"], session: "short", difficulty: "easy", artStyle: ["手繪"], platforms: ["PC", "Switch", "PlayStation", "Xbox", "Mobile"], priceType: "paid", priceRange: "約 NT$ 400～600", languages: ["繁體中文"], cover: "❋", coverClass: "cover-gris" },
  { id: "slime-rancher", nameZh: "史萊姆牧場", nameEn: "Slime Rancher", description: "在遙遠星球照顧可愛史萊姆，探索新地區並經營一座色彩繽紛的牧場。", genres: ["模擬", "冒險"], moods: ["療癒", "放鬆", "探索"], modes: ["單人"], session: "medium", difficulty: "easy", artStyle: ["卡通"], platforms: ["PC", "Switch", "PlayStation", "Xbox"], priceType: "paid", priceRange: "約 NT$ 600～800", languages: ["繁體中文"], cover: "●", coverClass: "cover-slime" },
  { id: "valorant", nameZh: "特戰英豪", nameEn: "VALORANT", description: "和隊友溝通、掌握技能與槍法，在每一回合的競技對局中找出勝利方法。", genres: ["射擊", "競技"], moods: ["刺激", "緊張"], modes: ["多人", "競技"], session: "short", difficulty: "hard", artStyle: ["動漫"], platforms: ["PC"], priceType: "free", priceRange: "免費遊玩", languages: ["繁體中文"], cover: "◇", coverClass: "cover-valorant" },
];

export const genreOptions = ["動作", "冒險", "建造", "派對", "模擬", "解謎", "策略", "恐怖", "生存", "射擊", "休閒", "敘事", "角色扮演"];
export const moodOptions = ["放鬆", "刺激", "療癒", "黑暗", "幽默", "沉浸", "緊張", "探索"];
export const modeOptions = ["單人", "多人", "合作", "競技"];
export const sessionOptions = [
  { value: "short", label: "短時長", hint: "30分鐘" },
  { value: "medium", label: "中等時長", hint: "一個晚上" },
  { value: "long", label: "高時長", hint: "一天以上" },
];
export const difficultyOptions = [
  { value: "easy", label: "輕鬆上手" },
  { value: "medium", label: "有點挑戰" },
  { value: "hard", label: "越難越好" },
];
export const platformOptions = ["PC", "PlayStation", "Switch", "Xbox", "Mobile"];
export const languageOptions = ["需要繁體中文介面", "需要繁體中文字幕", "需要繁體中文語音", "語言不限"] as const;
