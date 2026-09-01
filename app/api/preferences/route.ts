import { NextResponse } from "next/server";
import { avoidOptions, normalizePreferences, parseFreeText, type Preferences } from "../../../lib/recommender";
import { difficultyOptions, genreOptions, languageOptions, modeOptions, moodOptions, platformOptions, sessionOptions } from "../../../lib/games";

export const runtime = "nodejs";

const preferenceSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    genres: { type: "array", items: { type: "string", enum: genreOptions }, maxItems: 5 },
    moods: { type: "array", items: { type: "string", enum: moodOptions }, maxItems: 5 },
    modes: { type: "array", items: { type: "string", enum: modeOptions }, maxItems: 4 },
    session: { type: "string", enum: ["", ...sessionOptions.map((item) => item.value)] },
    difficulty: { type: "string", enum: ["", ...difficultyOptions.map((item) => item.value)] },
    platforms: { type: "array", items: { type: "string", enum: platformOptions }, maxItems: 5 },
    language: { type: "array", items: { type: "string", enum: languageOptions }, maxItems: 3 },
    budget: { type: "string", enum: ["free", "paid", "any"] },
    avoid: { type: "array", items: { type: "string", enum: avoidOptions }, maxItems: 5 },
  },
  required: ["genres", "moods", "modes", "session", "difficulty", "platforms", "language", "budget", "avoid"],
} as const;

const systemPrompt = `你是 Game Match 的遊戲偏好整理器。請把使用者的繁體中文或英文描述轉成指定 JSON。
只能使用 schema 中的 enum 值；沒有提到的條件使用空陣列、空字串或不限。
不要推薦遊戲、不要補充遊戲資料，也不要把「想避開」的內容放進一般偏好欄位。
判斷規則：短時長或 30 分鐘代表 short，中等時長或一個晚上代表 medium，高時長或一天以上代表 long；language 必須輸出陣列，可同時包含「需要繁體中文介面」、「需要繁體中文字幕」、「需要繁體中文語音」，未指定時輸出「語言不限」；提到繁體中文介面、UI 或界面時加入「需要繁體中文介面」，提到字幕時加入「需要繁體中文字幕」，提到語音或配音時加入「需要繁體中文語音」；輕鬆、新手代表 easy，困難、硬核代表 hard；沒有明確提到難度則留空。`;

function responseText(payload: { output_text?: unknown; output?: unknown[] }) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const chunks = (payload.output ?? []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const text = (part as { text?: unknown }).text;
      return typeof text === "string" ? [text] : [];
    });
  });
  return chunks.join("");
}

async function parseWithOpenAI(text: string): Promise<Preferences> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.6",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "game_preferences",
          strict: true,
          schema: preferenceSchema,
        },
      },
      max_output_tokens: 500,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  const payload = (await response.json()) as { output_text?: unknown; output?: unknown[] };
  const raw = responseText(payload);
  if (!raw) throw new Error("OpenAI returned no structured output");
  return normalizePreferences(JSON.parse(raw));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return NextResponse.json({ error: "請輸入想玩的遊戲描述。" }, { status: 400 });
    if (text.length > 300) return NextResponse.json({ error: "描述最多 300 個字。" }, { status: 400 });

    try {
      const preferences = await parseWithOpenAI(text);
      return NextResponse.json({ source: "ai", preferences });
    } catch (error) {
      console.warn("Falling back to local preference parsing:", error instanceof Error ? error.message : error);
      return NextResponse.json({
        source: "local",
        preferences: parseFreeText(text),
      });
    }
  } catch {
    return NextResponse.json({ error: "無法讀取這段描述，請稍後再試。" }, { status: 400 });
  }
}
