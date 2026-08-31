import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server credentials are not configured");

const moodByAppId = {
  1062090: ["放鬆", "沉浸", "探索"], 108600: ["黑暗", "緊張", "沉浸"], 1091500: ["黑暗", "刺激", "沉浸"],
  1151340: ["探索", "刺激", "沉浸"], 1190970: ["放鬆", "療癒", "沉浸"], 1248130: ["放鬆", "沉浸", "探索"],
  1282730: ["黑暗", "刺激", "沉浸"], 1336490: ["緊張", "沉浸", "探索"], 1366540: ["沉浸", "探索", "放鬆"],
  1455840: ["放鬆", "療癒", "探索"], 1601580: ["黑暗", "緊張", "沉浸"], 1985690: ["幽默", "探索", "沉浸"],
  200510: ["緊張", "刺激", "沉浸"], 212680: ["緊張", "探索", "沉浸"], 214950: ["沉浸", "探索", "緊張"],
  227300: ["放鬆", "沉浸", "探索"], 231430: ["緊張", "刺激", "沉浸"], 236850: ["沉浸", "探索", "緊張"],
  2379780: ["刺激", "沉浸", "幽默"], 244160: ["沉浸", "探索", "緊張"], 255710: ["放鬆", "沉浸", "探索"],
  262060: ["黑暗", "緊張", "沉浸"], 26800: ["沉浸", "探索"], 268500: ["緊張", "刺激", "沉浸"],
  281990: ["探索", "沉浸", "緊張"], 286160: ["幽默", "放鬆", "沉浸"], 289070: ["探索", "沉浸", "緊張"],
  292030: ["黑暗", "沉浸", "探索"], 294100: ["沉浸", "幽默", "緊張"], 319510: ["黑暗", "緊張", "沉浸"],
  323190: ["黑暗", "緊張", "沉浸"], 377160: ["探索", "沉浸", "刺激"], 394360: ["沉浸", "緊張", "探索"],
  4000: ["幽默", "探索", "放鬆"], 413150: ["放鬆", "療癒", "沉浸"], 427520: ["沉浸", "探索", "放鬆"],
  431240: ["放鬆", "幽默", "刺激"], 457140: ["緊張", "沉浸", "探索"], 573090: ["沉浸", "探索", "緊張"],
  590380: ["緊張", "刺激", "沉浸"], 632470: ["黑暗", "幽默", "沉浸"], 646570: ["沉浸", "刺激", "緊張"],
  648350: ["沉浸", "探索", "緊張"], 690830: ["放鬆", "沉浸", "探索"], 72850: ["探索", "沉浸", "刺激"],
  787860: ["放鬆", "沉浸", "探索"], 8930: ["探索", "沉浸", "緊張"], 913740: ["黑暗", "緊張", "沉浸"],
  945360: ["幽默", "緊張", "刺激"], 949230: ["放鬆", "沉浸", "探索"], 960090: ["幽默", "刺激", "緊張"],
  975370: ["沉浸", "探索", "緊張"],
};

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const updates = Object.entries(moodByAppId).map(([appId, moods]) => ({ appId, moods }));
const results = await Promise.all(updates.map(async ({ appId, moods }) => {
  const { error } = await client.from("games").update({ moods }).eq("source", "steam").eq("external_id", appId);
  return error ? { appId, error: error.message } : null;
}));
const { error: genreError } = await client.from("games").update({ genres: ["解謎"] }).eq("source", "steam").eq("external_id", "1985690");
if (genreError) results.push({ appId: "1985690", error: genreError.message });
const failures = results.filter(Boolean);
console.log(JSON.stringify({ moodRows: updates.length, lookerGenreUpdated: !genreError, failures }, null, 2));
if (failures.length) process.exitCode = 1;
