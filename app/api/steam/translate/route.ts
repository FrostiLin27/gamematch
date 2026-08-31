import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "../../../../lib/supabase-admin";
import { translateSteamDescription, type SteamGame } from "../../../../lib/steam";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expected = process.env.STEAM_SYNC_TOKEN;
  const provided = request.headers.get("x-steam-sync-token");
  return Boolean(expected && provided && provided === expected);
}

function hasChinese(value: string) {
  return /[\u3400-\u9fff]/u.test(value);
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin || !process.env.OPENAI_API_KEY || !process.env.STEAM_SYNC_TOKEN) {
    return NextResponse.json({ error: "Steam 翻譯服務尚未設定。" }, { status: 503 });
  }
  if (!isAuthorized(request)) return NextResponse.json({ error: "未授權的翻譯請求。" }, { status: 401 });
  const admin = supabaseAdmin;

  try {
    const body = await request.json().catch(() => ({})) as { limit?: unknown };
    const limit = typeof body.limit === "number" && Number.isSafeInteger(body.limit)
      ? Math.min(Math.max(body.limit, 1), 20)
      : 20;
    const { data, error } = await admin
      .from("games")
      .select("id,external_id,description")
      .eq("source", "steam")
      .not("description", "is", null)
      .limit(1000);
    if (error) return NextResponse.json({ error: "讀取遊戲簡介失敗。" }, { status: 502 });

    const candidates = (data ?? [])
      .filter((row) => typeof row.description === "string" && row.description.trim() && !hasChinese(row.description))
      .slice(0, limit);
    const results = await Promise.allSettled(candidates.map(async (row) => {
      const game: SteamGame = {
        appId: Number(row.external_id),
        name: "",
        nameEn: "",
        description: row.description,
        genres: [],
        modes: [],
        platforms: ["PC"],
        priceType: "paid",
        priceRange: "",
        languages: [],
        coverUrl: "",
        headerImage: "",
        steamUrl: "",
        releaseDate: "",
        metacriticScore: null,
      };
      const translated = await translateSteamDescription(game);
      if (translated.description === row.description || !hasChinese(translated.description)) throw new Error("翻譯結果未包含繁體中文");
      const update = await admin.from("games").update({ description: translated.description }).eq("id", row.id);
      if (update.error) throw new Error(update.error.message);
      return row.external_id;
    }));

    const translated = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
    const failedAppIds = results.flatMap((result, index) => result.status === "rejected" ? [candidates[index].external_id] : []);
    return NextResponse.json({ translated: translated.length, failedAppIds, candidates: candidates.length });
  } catch (error) {
    console.error("Steam description translation failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "翻譯請求格式不正確。" }, { status: 400 });
  }
}
