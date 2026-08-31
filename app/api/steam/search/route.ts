import { NextResponse } from "next/server";
import { searchSteamGames } from "../../../../lib/steam";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const term = url.searchParams.get("term")?.trim() || "";
  const parsedLimit = Number(url.searchParams.get("limit") || "6");
  const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 10) : 6;

  if (term.length < 2) return NextResponse.json({ error: "請至少輸入 2 個字元的 Steam 遊戲名稱。" }, { status: 400 });
  if (term.length > 80) return NextResponse.json({ error: "搜尋文字最多 80 個字元。" }, { status: 400 });

  try {
    const result = await searchSteamGames(term, limit);
    return NextResponse.json({ source: "steam-store", query: term, ...result });
  } catch (error) {
    console.error("Steam search failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "目前無法取得 Steam 資料，請稍後再試。" }, { status: 502 });
  }
}
