# Game Match｜遊戲火柴

依照《Game Match 遊戲火柴》企劃書建立的本地 MVP，目前已接上 Supabase 與 Steam 遊戲資料。

## 目前資料狀態

- Supabase `public.games` 共 462 款：25 款 catalog、35 款 manual、402 款 Steam 遊戲
- 核心推薦資料完整：名稱、簡介、類型、氛圍、遊玩方式、時長、難度、平台、價格、語言與封面皆無空值
- 33 款 catalog/manual 遊戲已補上 Steam 官方連結與發售日期
- 繁體中文支援：介面 299 款、字幕 227 款、語音 23 款
- 207 款遊戲尚未有 Metacritic 評分；此欄位為選配資料
- 非 Steam 遊戲的平台／官網連結與 `art_style` 遊戲風格標籤目前暫不處理

## 已完成

- 冰雪主題入口、雪人與火柴互動視覺
- 「回答問題」逐題推薦流程（含進度、返回與跳過）
- 「自由描述」流程（本地關鍵字解析，不需 API Key）
- 自由描述 API：有 `OPENAI_API_KEY` 時使用 OpenAI Structured Outputs，沒有金鑰或服務失敗時自動 fallback 到本地解析
- 462 款 Supabase 遊戲資料（本地 seed 初始資料與 Steam 擴充資料）
- 標籤加權推薦：類型、氛圍、遊玩方式、時長、難度、平台、語言、預算
- 推薦理由、遊戲資訊與程式化封面卡
- 喜好評分、收藏、玩過／不適合回饋
- 下一款推薦與瀏覽器 localStorage 紀錄
- Supabase 遊戲目錄接入：已設定連線時讀取 `public.games`，未設定或連線失敗時回退本地資料
- Supabase Email/Password 帳號、偏好同步、遊戲回饋同步與推薦紀錄同步
- Steam Store 搜尋與遊戲詳情伺服器端 API
- 受保護的 Steam 遊戲匯入 Supabase API
- Steam 匯入優先使用商店繁體中文資料，並支援以 OpenAI 翻譯未本地化的英文簡介
- 桌面與手機響應式版面

## 啟動

```bash
npm install
npm run dev
```

開啟 http://localhost:3000。

目前仍可不連接 Supabase 或 Steam API。若要啟用自由描述的 AI 解析：

```bash
cp .env.example .env.local
# 在 .env.local 填入 OPENAI_API_KEY，以及 Supabase 的公開連線資訊
npm run dev
```

金鑰只會在 `/api/preferences` 伺服器路由使用，不會送到瀏覽器；未設定金鑰時，系統仍會以本地解析完成推薦。

## 正式部署（Vercel）

目前專案已加入 `vercel.json`，正式建置指令為 `npm ci` 與 `npm run build`。程式碼已推送至 [FrostiLin27/gamematch](https://github.com/FrostiLin27/gamematch)，並已建立 Vercel `game-match` 專案。

在 Vercel 的 Production 與 Preview 環境分別設定必要環境變數：

- 公開前端變數：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- 伺服器端變數：`OPENAI_API_KEY`、`OPENAI_MODEL`、`SUPABASE_SERVICE_ROLE_KEY`、`STEAM_WEB_API_KEY`、`STEAM_SYNC_TOKEN`

其中服務角色金鑰、Steam Web API 金鑰、同步 token 與 OpenAI 金鑰只能放在 Vercel 的伺服器端環境變數，不可放入 `NEXT_PUBLIC_*`。部署完成後，還要在 Supabase Authentication > URL Configuration 設定正式網站 URL 與 redirect URL。

目前 Production 已部署並可由 [game-match-sigma.vercel.app](https://game-match-sigma.vercel.app) 存取，部署建置與首頁驗證均已通過。Vercel 已連接 GitHub repository，推送至 `main` 會自動觸發 Production 部署。

## Supabase 資料庫

資料庫結構與目前遊戲目錄已準備好：

- `supabase/migrations/202608290001_initial_schema.sql`：資料表、RLS、trigger 與 index
- `supabase/migrations/202608290002_cloud_sync_policies.sql`：推薦項目寫入的 RLS policy
- `supabase/migrations/202608290003_steam_metadata.sql`：封面、Steam 連結、發售日期與 Metacritic 欄位
- `supabase/migrations/202608300004_traditional_chinese_support.sql`：繁中介面、字幕、語音欄位
- `supabase/seed.sql`：將本地 25 款初始遊戲匯入 `public.games`
- `scripts/`：Steam 匯入、語言支援、氛圍、發售日期與封面資料維護腳本

在新的 Supabase 專案中，先於 SQL Editor 依序執行 migration，再執行 seed。現有的 462 款擴充目錄是透過 `scripts/` 維護腳本匯入，不包含在 25 款初始 seed 內。接著將 Project Settings > API 的值填入 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

重新啟動 Next.js 後，首頁會自動從 `public.games` 讀取目錄。`SUPABASE_SERVICE_ROLE_KEY` 僅供伺服器端資料匯入工作使用，不可放入瀏覽器程式碼。

登入後，系統會載入 `user_preferences` 與 `game_feedback`；完成問答或自由描述推薦時會同步偏好與 `recommendation_sessions`，在推薦結果送出回饋時會同步 `game_feedback`。未登入時仍使用瀏覽器 localStorage。

## Steam API

目前已提供不需要 API key 的 Steam Store API：

```bash
curl "http://localhost:3000/api/steam/search?term=Hades&limit=5"
curl "http://localhost:3000/api/steam/games/1145360"
```

搜尋與詳情請求只在 Next.js server route 執行，瀏覽器不會直接呼叫 Steam，也不會暴露任何 server-only key。指定遊戲匯入 Supabase 時，先在 `.env.local` 設定 `SUPABASE_SERVICE_ROLE_KEY` 與 `STEAM_SYNC_TOKEN`，再從受保護的 server route 傳入 App ID：

```bash
curl -X POST "http://localhost:3000/api/steam/sync" \
  -H "Content-Type: application/json" \
  -H "x-steam-sync-token: YOUR_STEAM_SYNC_TOKEN" \
  -d '{"appIds":[1145360,1145350]}'
```

同步 route 最多一次處理 20 款遊戲，並以 `steam-{appId}` 作為穩定 ID。完整全量遊戲清單同步仍需 `STEAM_WEB_API_KEY` 與後續的受排程保護匯入工作。若 Steam 沒有提供繁體中文簡介，可設定伺服器端 `OPENAI_API_KEY` 啟用自動翻譯；未設定時會保留 Steam 原文。

## 生成首頁背景圖片（可選）

圖片生成 CLI 已準備在專案虛擬環境 `.venv` 中，使用前請先在 OpenAI Platform 建立 API key：

1. 開啟 https://platform.openai.com/api-keys 並登入。
2. 建立 API key，金鑰只會完整顯示一次，請立即保存到本機密碼管理工具。
3. 複製 `.env.example` 為 `.env`，填入金鑰；不要提交 `.env`，也不要把金鑰貼到聊天中。
4. 在 macOS/zsh 載入環境變數：

```bash
set -a; source .env; set +a
```

CLI 的 dry-run（不會呼叫 API）：

```bash
.venv/bin/python /Users/daniel081993/.codex/skills/.system/imagegen/scripts/image_gen.py generate \
  --prompt "A cute illustrated snowy winter landscape for a website background, soft blue snow, rounded snow hills, tiny warm lights, playful storybook style, no text, no watermark" \
  --size 1536x1024 --quality medium \
  --out output/imagegen/winter-bg.png --dry-run
```

拿到 API key 後，移除最後的 `--dry-run` 即可真的生成圖片。
