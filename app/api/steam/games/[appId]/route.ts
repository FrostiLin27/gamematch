import { NextResponse } from "next/server";
import { getSteamGame } from "../../../../../lib/steam";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ appId: string }> }) {
  const appId = Number((await params).appId);
  if (!Number.isSafeInteger(appId) || appId <= 0) return NextResponse.json({ error: "Steam App ID 不正確。" }, { status: 400 });

  try {
    return NextResponse.json({ source: "steam-store", game: await getSteamGame(appId) });
  } catch (error) {
    console.error("Steam game details failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "找不到這款 Steam 遊戲或目前無法取得資料。" }, { status: 502 });
  }
}
