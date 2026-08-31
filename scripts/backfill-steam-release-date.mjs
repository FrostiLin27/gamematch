import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) throw new Error("Supabase 管理員環境變數未設定");

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const { data, error } = await supabase
  .from("games")
  .update({ release_date: "2012 年 5 月 2 日" })
  .eq("id", "steam-63380")
  .is("release_date", null)
  .select("id,name_zh,release_date")
  .maybeSingle();

if (error) throw error;
console.log(JSON.stringify({ updated: data ?? null }, null, 2));
