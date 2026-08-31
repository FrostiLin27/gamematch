import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "../../../../lib/supabase-admin";
import { getSteamGame, toCatalogRow, translateSteamDescription } from "../../../../lib/steam";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expected = process.env.STEAM_SYNC_TOKEN;
  const provided = request.headers.get("x-steam-sync-token");
  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin || !process.env.STEAM_SYNC_TOKEN) {
    return NextResponse.json({ error: "Steam 同步服務尚未設定。" }, { status: 503 });
  }
  if (!isAuthorized(request)) return NextResponse.json({ error: "未授權的同步請求。" }, { status: 401 });

  try {
    const body = await request.json() as { appIds?: unknown };
    const appIds = Array.isArray(body.appIds)
      ? [...new Set(body.appIds.filter((value): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0))]
      : [];
    if (appIds.length === 0 || appIds.length > 20) return NextResponse.json({ error: "appIds 必須包含 1 至 20 個有效的 Steam App ID。" }, { status: 400 });

    const results = await Promise.allSettled(appIds.map(async (appId) => translateSteamDescription(await getSteamGame(appId))));
    const rows = results.flatMap((result) => result.status === "fulfilled" ? [toCatalogRow(result.value)] : []);
    const failedAppIds = results.flatMap((result, index) => result.status === "rejected" ? [appIds[index]] : []);
    if (rows.length === 0) return NextResponse.json({ error: "找不到可匯入的 Steam 遊戲。", failedAppIds }, { status: 502 });

    const { error } = await supabaseAdmin.from("games").upsert(rows, { onConflict: "id" });
    if (error) {
      console.error("Steam catalog sync database error:", error.message);
      return NextResponse.json({ error: "Steam 遊戲資料寫入資料庫失敗。" }, { status: 502 });
    }
    return NextResponse.json({ source: "steam-store", synced: rows.length, failedAppIds, games: rows });
  } catch (error) {
    console.error("Steam catalog sync failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Steam 同步請求格式不正確。" }, { status: 400 });
  }
}
