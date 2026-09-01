import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured, supabaseAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export async function DELETE(request: Request) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: "資料庫服務尚未設定。" }, { status: 503 });
  }

  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "請先登入。" }, { status: 401 });

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: "登入狀態已失效，請重新登入。" }, { status: 401 });

  try {
    const body = await request.json() as { gameId?: unknown };
    const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";
    if (!gameId || gameId.length > 200) return NextResponse.json({ error: "遊戲識別碼不正確。" }, { status: 400 });

    const { data: deletedRows, error } = await supabaseAdmin
      .from("game_feedback")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("game_id", gameId)
      .select("game_id");

    if (error) {
      console.error("Game feedback deletion failed:", error.message);
      return NextResponse.json({ error: "清除遊戲紀錄失敗。" }, { status: 500 });
    }

    return NextResponse.json({ deleted: deletedRows?.length ?? 0 });
  } catch {
    return NextResponse.json({ error: "無法處理清除請求。" }, { status: 400 });
  }
}
