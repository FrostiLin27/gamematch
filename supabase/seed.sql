-- Seed the current local catalog into Supabase.
-- Generated from lib/games.ts (25 catalog entries).
insert into public.games (id, source, external_id, name_zh, name_en, description, genres, moods, modes, session, difficulty, art_style, platforms, price_type, price_range, languages, cover, cover_class, featured)
values
  ('spiritfarer', 'catalog', null, 'Spiritfarer', 'Spiritfarer', '在一艘溫暖的船上陪伴靈魂，慢慢探索一個關於告別與友誼的手繪世界。', array['冒險', '模擬']::text[], array['放鬆', '療癒', '沉浸']::text[], array['單人']::text[], 'medium', 'easy', array['卡通', '手繪']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 500～700', array['繁體中文']::text[], '✦', 'cover-sunset', true),
  ('outer-wilds', 'catalog', null, '星際拓荒', 'Outer Wilds', '乘著小小的太空船，追尋太陽系裡一個等待被解開的古老謎團。', array['冒險', '解謎']::text[], array['探索', '沉浸', '神秘']::text[], array['單人']::text[], 'medium', 'medium', array['低多邊形', '寫實']::text[], array['PC', 'PlayStation', 'Xbox', 'Switch']::text[], 'paid', '約 NT$ 700～900', array['繁體中文']::text[], '◌', 'cover-space', false),
  ('stardew', 'catalog', null, '星露谷物語', 'Stardew Valley', '繼承一座荒廢農場，種田、交朋友，照自己的步調過一段新的生活。', array['模擬', '角色扮演']::text[], array['放鬆', '療癒', '幽默']::text[], array['單人', '合作']::text[], 'long', 'easy', array['像素']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 400～500', array['繁體中文']::text[], '♧', 'cover-farm', false),
  ('hades', 'catalog', null, '黑帝斯', 'Hades', '一次又一次從冥界突圍，在神祇與家族的故事裡享受流暢的動作戰鬥。', array['動作', '角色扮演', '冒險']::text[], array['刺激', '緊張', '沉浸']::text[], array['單人']::text[], 'short', 'hard', array['動漫', '手繪']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 700～900', array['繁體中文']::text[], '♠', 'cover-underworld', false),
  ('a-short-hike', 'catalog', null, 'A Short Hike', 'A Short Hike', '爬上山頂收訊號吧。沿途釣魚、飛行與認識旅伴，短短一段很舒服的旅程。', array['冒險', '休閒']::text[], array['放鬆', '療癒', '探索']::text[], array['單人']::text[], 'short', 'easy', array['像素', '卡通']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 200～300', array['英文']::text[], '⌁', 'cover-hike', false),
  ('portal-2', 'catalog', null, '傳送門 2', 'Portal 2', '用傳送門和一點點幽默，解開一座古怪實驗室裡精巧又令人滿足的謎題。', array['解謎', '冒險']::text[], array['幽默', '探索', '沉浸']::text[], array['單人', '合作']::text[], 'medium', 'medium', array['寫實']::text[], array['PC', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 300～500', array['繁體中文']::text[], '◎', 'cover-portal', false),
  ('dave-diver', 'catalog', null, '潛水員戴夫', 'Dave the Diver', '白天潛入藍洞捕魚，晚上經營壽司店，一款節奏豐富又充滿驚喜的像素冒險。', array['冒險', '模擬', '休閒']::text[], array['幽默', '探索', '放鬆']::text[], array['單人']::text[], 'medium', 'easy', array['像素']::text[], array['PC', 'Switch', 'PlayStation']::text[], 'paid', '約 NT$ 600～800', array['繁體中文']::text[], '≋', 'cover-ocean', false),
  ('inscryption', 'catalog', null, '邪靈入侵', 'Inscryption', '一場不太對勁的牌局。解謎、卡牌與陰鬱敘事交織成意外深刻的冒險。', array['策略', '解謎', '恐怖']::text[], array['黑暗', '神秘', '緊張']::text[], array['單人']::text[], 'medium', 'hard', array['像素', '黑暗']::text[], array['PC', 'PlayStation', 'Switch']::text[], 'paid', '約 NT$ 500～700', array['繁體中文']::text[], '☽', 'cover-cabin', false),
  ('unpacking', 'catalog', null, 'Unpacking', 'Unpacking', '把物品放進新家，從熟悉的日常物件中拼出一個人的成長故事。', array['解謎', '休閒', '模擬']::text[], array['放鬆', '療癒', '沉浸']::text[], array['單人']::text[], 'short', 'easy', array['像素']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 400～600', array['繁體中文']::text[], '▦', 'cover-room', false),
  ('slay-spire', 'catalog', null, '殺戮尖塔', 'Slay the Spire', '組出你的牌組，攀登一座每次都不一樣的尖塔，適合一局一局慢慢琢磨。', array['策略', '角色扮演']::text[], array['沉浸', '刺激', '探索']::text[], array['單人']::text[], 'short', 'hard', array['卡通']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 500～700', array['繁體中文']::text[], '△', 'cover-spire', false),
  ('it-takes-two', 'catalog', null, '雙人成行', 'It Takes Two', '只有兩個人才能解開的合作關卡，一起度過一場充滿創意的關係修復之旅。', array['冒險', '動作']::text[], array['幽默', '刺激', '療癒']::text[], array['合作', '多人']::text[], 'long', 'medium', array['卡通']::text[], array['PC', 'PlayStation', 'Xbox', 'Switch']::text[], 'paid', '約 NT$ 700～1,000', array['繁體中文']::text[], '∞', 'cover-toy', false),
  ('deep-rock', 'catalog', null, '深岩銀河', 'Deep Rock Galactic', '和太空矮人隊友挖進危險星球，合作採礦、開槍，還要一起安全回家。', array['動作', '射擊', '冒險']::text[], array['刺激', '幽默', '緊張']::text[], array['合作', '多人']::text[], 'medium', 'medium', array['卡通']::text[], array['PC', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 500～800', array['繁體中文']::text[], '✹', 'cover-cave', false),
  ('firewatch', 'catalog', null, '看火人', 'Firewatch', '在壯闊森林裡擔任守林員，透過無線電與遠方的人建立一段特別的連結。', array['冒險', '敘事']::text[], array['沉浸', '神秘', '放鬆']::text[], array['單人']::text[], 'short', 'easy', array['寫實']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 500～700', array['繁體中文']::text[], '◒', 'cover-forest', false),
  ('hollow-knight', 'catalog', null, '空洞騎士', 'Hollow Knight', '深入廣闊的地下王國，面對精準戰鬥與一個等待被發現的蒼涼傳說。', array['動作', '冒險']::text[], array['黑暗', '探索', '沉浸']::text[], array['單人']::text[], 'long', 'hard', array['手繪', '黑暗']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 400～600', array['繁體中文']::text[], '◉', 'cover-hollow', false),
  ('minecraft', 'catalog', null, 'Minecraft', 'Minecraft', '用方塊蓋出任何想像，獨自或和朋友一起在沒有邊界的世界裡生活。', array['生存', '建造', '冒險']::text[], array['放鬆', '探索', '刺激']::text[], array['單人', '合作', '多人']::text[], 'long', 'medium', array['像素']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 800～1,000', array['繁體中文']::text[], '▦', 'cover-blocks', false),
  ('dead-cells', 'catalog', null, '重生細胞', 'Dead Cells', '在不斷變化的城堡中戰鬥與重生，快節奏、爽快又適合短時間挑戰。', array['動作', '冒險']::text[], array['刺激', '緊張', '探索']::text[], array['單人']::text[], 'short', 'hard', array['像素']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 600～800', array['繁體中文']::text[], '⚔', 'cover-cells', false),
  ('dorfromantik', 'catalog', null, 'Dorfromantik', 'Dorfromantik', '拼起一片片森林、河流與村莊，安靜地打造屬於自己的小小景色。', array['策略', '休閒', '解謎']::text[], array['放鬆', '療癒', '探索']::text[], array['單人']::text[], 'short', 'easy', array['低多邊形']::text[], array['PC', 'Switch']::text[], 'paid', '約 NT$ 300～500', array['繁體中文']::text[], '⌂', 'cover-village', false),
  ('phasmophobia', 'catalog', null, '恐鬼症', 'Phasmophobia', '拿起設備找出鬼魂的證據，和朋友在語音裡互相壯膽。', array['恐怖', '冒險']::text[], array['恐怖', '緊張', '刺激']::text[], array['合作', '多人']::text[], 'medium', 'medium', array['寫實', '黑暗']::text[], array['PC', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 400～600', array['繁體中文']::text[], '☠', 'cover-ghost', false),
  ('overcooked-2', 'catalog', null, '煮過頭 2', 'Overcooked! 2', '在會移動的廚房裡和朋友分工合作，混亂、歡樂，也很考驗默契。', array['休閒', '派對', '模擬']::text[], array['幽默', '刺激', '緊張']::text[], array['合作', '多人']::text[], 'short', 'medium', array['卡通']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 500～800', array['繁體中文']::text[], '♨', 'cover-kitchen', false),
  ('disco-elysium', 'catalog', null, '極樂迪斯科', 'Disco Elysium', '扮演一名失憶警探，在城市裡調查案件，也和自己腦中的聲音交涉。', array['角色扮演', '敘事', '解謎']::text[], array['黑暗', '幽默', '沉浸']::text[], array['單人']::text[], 'long', 'medium', array['手繪']::text[], array['PC', 'PlayStation', 'Xbox', 'Switch']::text[], 'paid', '約 NT$ 700～1,000', array['繁體中文']::text[], '✎', 'cover-disco', false),
  ('terraria', 'catalog', null, '泰拉瑞亞', 'Terraria', '挖掘、建造、戰鬥與探索都由你決定，像一盒可以無限延伸的冒險玩具。', array['生存', '建造', '冒險']::text[], array['探索', '刺激', '放鬆']::text[], array['單人', '合作', '多人']::text[], 'long', 'medium', array['像素']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 300～500', array['繁體中文']::text[], '⛏', 'cover-terraria', false),
  ('mini-motorways', 'catalog', null, '迷你公路', 'Mini Motorways', '用簡潔的線條規劃城市交通，看城市逐漸長大並保持流動。', array['策略', '模擬']::text[], array['放鬆', '沉浸', '緊張']::text[], array['單人']::text[], 'short', 'medium', array['低多邊形']::text[], array['PC', 'Switch', 'Mobile']::text[], 'paid', '約 NT$ 300～500', array['繁體中文']::text[], '╱', 'cover-road', false),
  ('gris', 'catalog', null, 'GRIS', 'GRIS', '在一幅會呼吸的水彩畫中前進，沒有死亡壓力，只有音樂、色彩與情緒。', array['冒險', '解謎']::text[], array['療癒', '放鬆', '沉浸']::text[], array['單人']::text[], 'short', 'easy', array['手繪']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox', 'Mobile']::text[], 'paid', '約 NT$ 400～600', array['繁體中文']::text[], '❋', 'cover-gris', false),
  ('slime-rancher', 'catalog', null, '史萊姆牧場', 'Slime Rancher', '在遙遠星球照顧可愛史萊姆，探索新地區並經營一座色彩繽紛的牧場。', array['模擬', '冒險']::text[], array['療癒', '放鬆', '探索']::text[], array['單人']::text[], 'medium', 'easy', array['卡通']::text[], array['PC', 'Switch', 'PlayStation', 'Xbox']::text[], 'paid', '約 NT$ 600～800', array['繁體中文']::text[], '●', 'cover-slime', false),
  ('valorant', 'catalog', null, '特戰英豪', 'VALORANT', '和隊友溝通、掌握技能與槍法，在每一回合的競技對局中找出勝利方法。', array['射擊', '競技']::text[], array['刺激', '緊張']::text[], array['多人', '競技']::text[], 'short', 'hard', array['動漫']::text[], array['PC']::text[], 'free', '免費遊玩', array['繁體中文']::text[], '◇', 'cover-valorant', false)
on conflict (id) do update set
  name_zh = excluded.name_zh,
  name_en = excluded.name_en,
  description = excluded.description,
  genres = excluded.genres,
  moods = excluded.moods,
  modes = excluded.modes,
  session = excluded.session,
  difficulty = excluded.difficulty,
  art_style = excluded.art_style,
  platforms = excluded.platforms,
  price_type = excluded.price_type,
  price_range = excluded.price_range,
  languages = excluded.languages,
  cover = excluded.cover,
  cover_class = excluded.cover_class,
  featured = excluded.featured,
  updated_at = timezone('utc', now());

-- Keep the bundled catalog's legacy language labels in sync with the typed support fields.
update public.games
set traditional_chinese_interface = true,
    traditional_chinese_subtitles = true
where source = 'catalog'
  and languages @> array['繁體中文']::text[];
