import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const reportPath = process.argv[2] || "/tmp/game-match-steam-language-browser-all.json";
const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server credentials are not configured");

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const verified = report.filter((item) => item.ok === true && item.found === true);
let updated = 0;
const failures = [];
for (let offset = 0; offset < verified.length; offset += 20) {
  const batch = verified.slice(offset, offset + 20);
  const results = await Promise.all(batch.map(async (item) => {
    const { error } = await client
      .from("games")
      .update({
        traditional_chinese_interface: item.interface === true,
        traditional_chinese_subtitles: item.subtitles === true,
        traditional_chinese_voice: item.voice === true,
      })
      .eq("source", "steam")
      .eq("external_id", String(item.appId));
    return error ? { appId: item.appId, error: error.message } : null;
  }));
  failures.push(...results.filter(Boolean));
  updated += results.filter((item) => item === null).length;
}

console.log(JSON.stringify({ verified: verified.length, updated, skippedAgeOrMissing: report.length - verified.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
