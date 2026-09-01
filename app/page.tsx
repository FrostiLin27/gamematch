"use client";

import { useEffect, useMemo, useState } from "react";
import BackgroundMusic from "./components/BackgroundMusic";
import { games, genreOptions, moodOptions, modeOptions, platformOptions, languageOptions, sessionOptions, difficultyOptions, type Game } from "../lib/games";
import { mapDatabaseGame } from "../lib/catalog";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { emptyPreferences, normalizePreferences, parseFreeText, recommendGames, type HistoryItem, type Preferences } from "../lib/recommender";
import type { User } from "@supabase/supabase-js";
import type { SteamGame } from "../lib/steam";

type Scene = "landing" | "mode" | "questions" | "freeText" | "analyzing" | "results";
type FeedbackStatus = "disliked" | "neutral" | "liked";
type AuthMode = "signIn" | "signUp";

let matchAudioContext: AudioContext | null = null;

function playMatchStrike() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  matchAudioContext ??= new AudioContextClass();
  const context = matchAudioContext;
  if (context.state === "suspended") void context.resume();

  const now = context.currentTime;
  const duration = 0.16;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const noise = buffer.getChannelData(0);
  for (let index = 0; index < noise.length; index += 1) {
    const fade = 1 - index / noise.length;
    noise[index] = (Math.random() * 2 - 1) * fade;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2400, now);
  filter.Q.setValueAtTime(0.8, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(now);
}

const questions = [
  { key: "genres", title: "今天想玩什麼類型？", subtitle: "選擇你旅行的方向", options: genreOptions, multi: true },
  { key: "moods", title: "喜歡什麼樣的遊戲氛圍？", subtitle: "讓當下的心情決定目的地", options: moodOptions, multi: true },
  { key: "modes", title: "想自己遊玩，還是多人同樂？", subtitle: "一個人的深夜 還是 一群人的熱鬧", options: modeOptions, multi: true },
  { key: "session", title: "偏好的遊戲時長？", subtitle: "不用規劃人生 只要規劃這一個篇章", options: sessionOptions.map((item) => item.value), multi: false },
  { key: "difficulty", title: "偏好的遊戲難度？", subtitle: "今天想被溫柔接住 還是正面迎戰", options: difficultyOptions.map((item) => item.value), multi: false },
  { key: "platforms", title: "偏好的遊戲平台？", subtitle: "選擇你現在手邊的裝置", options: platformOptions, multi: true },
  { key: "language", title: "需要繁體中文嗎？", subtitle: "讓體驗變得更快更流暢", options: languageOptions, multi: true },
  { key: "budget", title: "有預算限制嗎？", subtitle: "先把範圍縮小 更符合你的需求", options: ["free", "paid", "any"], multi: false },
  { key: "avoid", title: "有沒有不想接觸的類型 / 氛圍？", subtitle: "告訴我哪些不是你嚮往的目標", options: [...genreOptions, ...moodOptions], multi: true },
] as const;

const optionLabels: Record<string, string> = {
  short: "短時長", medium: "中等時長", long: "高時長", easy: "輕鬆上手", hard: "越難越好", free: "免費優先", paid: "可以付費", any: "沒有限制",
};
const difficultyLabels: Record<string, string> = Object.fromEntries(difficultyOptions.map((item) => [item.value, item.label]));

export default function Home() {
  const [scene, setScene] = useState<Scene>("landing");
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [freeText, setFreeText] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [catalog, setCatalog] = useState<Game[]>(games);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackStatus | null>(null);
  const [rating, setRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isParsingFreeText, setIsParsingFreeText] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState("翻動標籤、整理心情、點亮可能性");

  useEffect(() => {
    const saved = window.localStorage.getItem("game-match-history");
    if (saved) setHistory(JSON.parse(saved) as HistoryItem[]);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let isActive = true;

    client.auth.getSession().then(({ data }) => {
      if (isActive) setAuthUser(data.session?.user ?? null);
    });

    const { data: authState } = client.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setAuthUser(session?.user ?? null);
      if (session) setIsAuthPanelOpen(false);
    });

    return () => {
      isActive = false;
      authState.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || !supabase) return;
    const client = supabase;
    const user = authUser;
    let isActive = true;

    async function loadCloudData() {
      const [preferencesResult, feedbackResult] = await Promise.all([
        client.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        client.from("game_feedback").select("game_id,status,rating,favorite,updated_at").eq("user_id", user.id),
      ]);

      if (!isActive) return;
      if (preferencesResult.error) console.warn("Unable to load cloud preferences:", preferencesResult.error.message);
      if (feedbackResult.error) console.warn("Unable to load cloud feedback:", feedbackResult.error.message);

      if (preferencesResult.data) setPreferences(preferencesFromDatabase(preferencesResult.data));

      const localHistory = readLocalHistory();
      const cloudHistory = (feedbackResult.data ?? []).map(historyFromDatabase).filter((item): item is HistoryItem => item !== null);
      const mergedHistory = mergeHistory(localHistory, cloudHistory);
      setHistory(mergedHistory);
      window.localStorage.setItem("game-match-history", JSON.stringify(mergedHistory));

      if (localHistory.length > 0) await syncFeedbackToCloud(client, user.id, mergedHistory);
    }

    void loadCloudData();
    return () => {
      isActive = false;
    };
  }, [authUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;
    let isActive = true;

    async function loadCatalog() {
      try {
        const { data, error } = await client
          .from("games")
          .select("*")
          .order("featured", { ascending: false })
          .order("name_zh", { ascending: true });

        if (!isActive) return;
        if (error) {
          console.warn("Supabase game catalog unavailable; using local catalog:", error.message);
          return;
        }

        const databaseGames = (data ?? []).map(mapDatabaseGame).filter((game): game is Game => game !== null);
        if (databaseGames.length > 0) setCatalog(databaseGames);
      } catch (error) {
        console.warn("Supabase game catalog request failed; using local catalog:", error);
      }
    }

    void loadCatalog();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (shell) shell.scrollTop = 0;
  }, [scene]);

  const recommendations = useMemo(() => recommendGames(preferences, history, catalog.length, catalog), [preferences, history, catalog]);
  const recommendation = recommendations[activeRecommendation]?.game;
  const currentQuestion = questions[questionIndex];
  const currentValue = currentQuestion ? preferences[currentQuestion.key] : [];

  function startMode() { setScene("mode"); }

  function startQuestions() {
    setPreferences({ ...emptyPreferences });
    setQuestionIndex(0);
    setScene("questions");
  }

  function startFreeText() {
    setFreeText("");
    setIsParsingFreeText(false);
    setScene("freeText");
  }

  function chooseOption(value: string) {
    if (!currentQuestion) return;
    if (currentQuestion.multi) {
      const existing = Array.isArray(currentValue) ? currentValue as string[] : [];
      const next = currentQuestion.key === "language"
        ? value === "語言不限"
          ? (existing.includes(value) ? [] : [value])
          : (existing.includes(value) ? existing.filter((item) => item !== value) : [...existing.filter((item) => item !== "語言不限"), value])
        : (existing.includes(value) ? existing.filter((item) => item !== value) : [...existing, value]);
      setPreferences((old) => ({ ...old, [currentQuestion.key]: next }));
    } else {
      setPreferences((old) => ({ ...old, [currentQuestion.key]: value }));
    }
  }

  function nextQuestion() {
    if (questionIndex < questions.length - 1) setQuestionIndex((index) => index + 1);
    else beginAnalysis(preferences);
  }

  function beginAnalysis(nextPreferences: Preferences, notice = "翻動標籤、整理心情、點亮可能性", source: "questionnaire" | "free_text" = "questionnaire") {
    setPreferences(nextPreferences);
    setActiveRecommendation(0);
    setFeedback(null);
    setRating(0);
    setIsFavorite(false);
    setAnalysisNotice(notice);
    setScene("analyzing");
    void syncPreferencesToCloud(nextPreferences, source);
    void saveRecommendationSessionToCloud(nextPreferences, source);
    window.setTimeout(() => setScene("results"), 1650);
  }

  async function submitFreeText() {
    if (!freeText.trim()) return;
    setIsParsingFreeText(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: freeText.trim() }),
      });
      if (!response.ok) throw new Error("Preference parser request failed");
      const payload = (await response.json()) as { source?: "ai" | "local"; preferences?: unknown; message?: string };
      if (!payload.preferences) throw new Error("Preference parser returned no preferences");
      const notice = payload.source === "ai" ? "AI 已整理你的遊戲口味" : payload.message || "目前使用本地分析，仍可完成推薦";
      beginAnalysis(normalizePreferences(payload.preferences), notice, "free_text");
    } catch {
      beginAnalysis(parseFreeText(freeText), "目前使用本地分析，仍可完成推薦", "free_text");
    } finally {
      setIsParsingFreeText(false);
    }
  }

  function persistCurrentFeedback(patch: Partial<Pick<HistoryItem, "status" | "rating" | "favorite">>) {
    if (!recommendation) return;
    const previous = history.find((item) => item.gameId === recommendation.id);
    const item: HistoryItem = { gameId: recommendation.id, status: patch.status ?? previous?.status ?? "neutral", rating: patch.rating ?? previous?.rating ?? rating, favorite: patch.favorite ?? previous?.favorite ?? isFavorite, updatedAt: new Date().toISOString() };
    const nextHistory = [...history.filter((entry) => entry.gameId !== recommendation.id), item];
    setHistory(nextHistory);
    window.localStorage.setItem("game-match-history", JSON.stringify(nextHistory));
    void syncFeedbackToCloud(supabase, authUser?.id, [item]);
  }

  function saveFeedback(status: FeedbackStatus) {
    if (!recommendation) return;
    persistCurrentFeedback({ status });
    setFeedback(status);
  }

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !authEmail.trim() || authPassword.length < 6) {
      setAuthMessage("請輸入有效 Email，密碼至少需要 6 個字元。");
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage("");
    const result = authMode === "signIn"
      ? await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
      : await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
    setIsAuthLoading(false);

    if (result.error) {
      setAuthMessage(result.error.message);
      return;
    }
    if (authMode === "signUp" && !result.data.session) {
      setAuthMessage("註冊成功，請先到 Email 完成驗證。");
    } else {
      setAuthMessage("登入成功，雲端資料同步中…");
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthMessage(error.message);
    else setAuthMessage("");
  }

  async function syncPreferencesToCloud(nextPreferences: Preferences, source: "questionnaire" | "free_text") {
    if (!supabase || !authUser) return;
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: authUser.id,
      genres: nextPreferences.genres,
      moods: nextPreferences.moods,
      modes: nextPreferences.modes,
      session: nextPreferences.session || null,
      difficulty: nextPreferences.difficulty || null,
      platforms: nextPreferences.platforms,
      language_preferences: nextPreferences.language,
      budget: nextPreferences.budget,
      avoid: nextPreferences.avoid,
      source,
    });
    if (error) console.warn("Unable to sync preferences:", error.message);
  }

  async function saveRecommendationSessionToCloud(nextPreferences: Preferences, source: "questionnaire" | "free_text") {
    if (!supabase || !authUser) return;
    const matches = recommendGames(nextPreferences, history, catalog.length, catalog);
    const { data: session, error: sessionError } = await supabase
      .from("recommendation_sessions")
      .insert({ user_id: authUser.id, source, preferences: nextPreferences })
      .select("id")
      .single();
    if (sessionError || !session) {
      console.warn("Unable to save recommendation session:", sessionError?.message);
      return;
    }

    const { error: itemsError } = await supabase.from("recommendation_items").insert(
      matches.map((match, index) => ({ session_id: session.id, game_id: match.game.id, rank: index + 1, score: match.score, reason: match.reason })),
    );
    if (itemsError) console.warn("Unable to save recommendation items:", itemsError.message);
  }

  function nextRecommendation() {
    if (activeRecommendation < recommendations.length - 1) {
      setActiveRecommendation((index) => index + 1);
      setFeedback(null);
      setRating(0);
      setIsFavorite(false);
    } else {
      setFeedback(null);
      setActiveRecommendation(0);
      setScene("analyzing");
      window.setTimeout(() => setScene("results"), 1200);
    }
  }

  function restart() {
    setPreferences({ ...emptyPreferences });
    setQuestionIndex(0);
    setActiveRecommendation(0);
    setFeedback(null);
    setScene("landing");
  }

  return (
    <main className={`app-shell scene-${scene}`}>
      <Snowfall />
      <BackgroundMusic />
      <header className="topbar">
        <button className="brand" onClick={restart} aria-label="回到首頁"><span className="brand-mark">✦</span><span>GAME MATCH</span><small>遊戲火柴</small></button>
        <div className="topbar-note"><span className="status-dot" /> 一支火柴，點亮下一段旅程</div>
        {isSupabaseConfigured && <div className="topbar-actions"><a className="my-games-nav" href="/my-games">我的遊戲</a><AuthControls user={authUser} isOpen={isAuthPanelOpen} mode={authMode} email={authEmail} password={authPassword} message={authMessage} isLoading={isAuthLoading} onToggle={() => { setIsAuthPanelOpen((value) => !value); setAuthMessage(""); }} onModeChange={(mode) => { setAuthMode(mode); setAuthMessage(""); }} onEmailChange={setAuthEmail} onPasswordChange={setAuthPassword} onSubmit={submitAuth} onSignOut={signOut} /></div>}
      </header>

      {scene === "landing" && <Landing onStart={startMode} />}
      {scene === "mode" && <ModeSelection onQuestions={startQuestions} onFreeText={startFreeText} onBack={() => setScene("landing")} />}
      {scene === "questions" && currentQuestion && <QuestionFlow question={currentQuestion} index={questionIndex} total={questions.length} value={currentValue} onChoose={chooseOption} onNext={nextQuestion} onBack={() => questionIndex === 0 ? setScene("mode") : setQuestionIndex((index) => index - 1)} />}
      {scene === "freeText" && <FreeTextInput value={freeText} onChange={setFreeText} onSubmit={submitFreeText} isSubmitting={isParsingFreeText} onBack={() => setScene("mode")} />}
      {scene === "analyzing" && <Analyzing notice={analysisNotice} />}
      {scene === "results" && recommendation && <Results game={recommendation} index={activeRecommendation} total={recommendations.length} preferences={preferences} feedback={feedback} rating={rating} favorite={isFavorite} onRate={(nextRating) => { setRating(nextRating); persistCurrentFeedback({ rating: nextRating }); }} onFavorite={() => { const nextFavorite = !isFavorite; setIsFavorite(nextFavorite); persistCurrentFeedback({ favorite: nextFavorite }); }} onFeedback={saveFeedback} onNext={nextRecommendation} onRestart={restart} onEdit={() => setScene("mode")} />}
      {scene === "results" && !recommendation && <EmptyResults onRestart={restart} />}
    </main>
  );
}

function readLocalHistory() {
  try {
    const saved = window.localStorage.getItem("game-match-history");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter((item): item is HistoryItem => Boolean(item && typeof item.gameId === "string")) : [];
  } catch {
    return [];
  }
}

function preferencesFromDatabase(value: unknown) {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return normalizePreferences({
    genres: row.genres,
    moods: row.moods,
    modes: row.modes,
    session: row.session ?? "",
    difficulty: row.difficulty ?? "",
    platforms: row.platforms,
    language: row.language_preferences,
    budget: row.budget,
    avoid: row.avoid,
  });
}

function historyFromDatabase(value: unknown): HistoryItem | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const status = row.status;
  if (typeof row.game_id !== "string" || (status !== "disliked" && status !== "neutral" && status !== "liked")) return null;
  return {
    gameId: row.game_id,
    status,
    rating: typeof row.rating === "number" ? row.rating : 0,
    favorite: row.favorite === true,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date(0).toISOString(),
  };
}

function mergeHistory(localHistory: HistoryItem[], cloudHistory: HistoryItem[]) {
  const merged = new Map(cloudHistory.map((item) => [item.gameId, item]));
  for (const item of localHistory) {
    const existing = merged.get(item.gameId);
    if (!existing || Date.parse(item.updatedAt) >= Date.parse(existing.updatedAt)) merged.set(item.gameId, item);
  }
  return [...merged.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

async function syncFeedbackToCloud(client: typeof supabase, userId: string | undefined, items: HistoryItem[]) {
  if (!client || !userId || items.length === 0) return;
  const { error } = await client.from("game_feedback").upsert(
    items.map((item) => ({ user_id: userId, game_id: item.gameId, status: item.status, rating: item.rating, favorite: item.favorite })),
    { onConflict: "user_id,game_id" },
  );
  if (error) console.warn("Unable to sync feedback:", error.message);
}

function AuthControls({ user, isOpen, mode, email, password, message, isLoading, onToggle, onModeChange, onEmailChange, onPasswordChange, onSubmit, onSignOut }: { user: User | null; isOpen: boolean; mode: AuthMode; email: string; password: string; message: string; isLoading: boolean; onToggle: () => void; onModeChange: (mode: AuthMode) => void; onEmailChange: (email: string) => void; onPasswordChange: (password: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>; onSignOut: () => void | Promise<void> }) {
  if (user) {
    return <div className="auth-controls"><span className="auth-signed-in"><span className="status-dot" />{user.email?.split("@")[0] || "已登入"}</span><button className="auth-button" type="button" onClick={onSignOut}>登出</button></div>;
  }

  return <div className="auth-controls"><button className="auth-button" type="button" onClick={onToggle}>登入／註冊</button>{isOpen && <form className="auth-panel" onSubmit={onSubmit}><div className="auth-panel-heading"><strong>{mode === "signIn" ? "回到你的遊戲火柴" : "建立遊戲火柴帳號"}</strong><button type="button" className="auth-close" onClick={onToggle} aria-label="關閉登入面板">×</button></div><label>Email<input type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label><label>密碼<input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="至少 6 個字元" autoComplete={mode === "signIn" ? "current-password" : "new-password"} minLength={6} required /></label><button className="auth-submit" type="submit" disabled={isLoading}>{isLoading ? "處理中…" : mode === "signIn" ? "登入" : "註冊"}</button><button className="auth-switch" type="button" onClick={() => onModeChange(mode === "signIn" ? "signUp" : "signIn")}>{mode === "signIn" ? "還沒有帳號？註冊" : "已有帳號？登入"}</button>{message && <p className="auth-message" role="status">{message}</p>}</form>}</div>;
}

function Snowfall() {
  return <div className="snowfall" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ "--x": `${(index * 47) % 100}%`, "--delay": `${(index % 8) * -1.4}s`, "--duration": `${8 + (index % 5)}s`, "--size": `${3 + (index % 4)}px` } as React.CSSProperties}>✦</i>)}</div>;
}

function SceneFrame({ eyebrow, title, children, className = "" }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`scene-frame ${className}`}><div className="eyebrow"><span /> {eyebrow} <span /></div><h1>{title}</h1>{children}</section>;
}

function Snowman({ active = false }: { active?: boolean }) {
  return <div className={`snowman ${active ? "snowman-active" : ""}`} aria-hidden="true"><div className="scarf" /><div className="snowman-head"><span className="hat" /><span className="eye eye-left" /><span className="eye eye-right" /><span className="nose" /><span className="cheek cheek-left" /><span className="cheek cheek-right" /></div><div className="snowman-body"><span className="button button-one" /><span className="button button-two" /><span className="arm arm-left" /><span className="arm arm-right" /></div><div className="matchstick"><span /></div><div className="snowman-shadow" /></div>;
}

function Landing({ onStart }: { onStart: () => void }) {
  return <SceneFrame eyebrow="WELCOME TO YOUR NEXT ADVENTURE" title={<>在這裡體驗你的<br /><em>第二人生</em></>} className="landing-frame"><p className="hero-copy">讓我幫你點亮一款遊戲</p><div className="landing-stage"><Snowman /><div className="landing-spark">✦<small>準備好了嗎？</small></div></div><button className="light-button" onClick={onStart}><span className="button-flame">✦</span> 點燃火柴 <span className="arrow">→</span></button><p className="microcopy">依照你的喜好，找出最適合你的</p></SceneFrame>;
}

function ModeSelection({ onQuestions, onFreeText, onBack }: { onQuestions: () => void; onFreeText: () => void; onBack: () => void }) {
  return <SceneFrame eyebrow="CHOOSE YOUR SPARK" title={<>你想要怎麼<br /><em>找到它？</em></>} className="mode-frame"><p className="section-copy">每一支火柴 都是一個開始</p><div className="matchbox-grid"><Matchbox icon="☷" title="回答問題" caption="讓我一步步了解你的喜好" onClick={onQuestions} /><Matchbox icon="⌁" title="自由描述" caption="直接告訴我你心裡的想法" onClick={onFreeText} /></div><SteamSearchPanel /><BackButton onClick={onBack} /></SceneFrame>;
}

function Matchbox({ icon, title, caption, onClick }: { icon: string; title: string; caption: string; onClick: () => void }) {
  const [isIgniting, setIsIgniting] = useState(false);

  function handleClick() {
    if (isIgniting) return;
    playMatchStrike();
    setIsIgniting(true);
    window.setTimeout(onClick, 520);
  }

  return <button className={`matchbox ${isIgniting ? "igniting" : ""}`} onClick={handleClick}><span className="matchbox-tray" aria-hidden="true" /><span className="matchbox-flame" aria-hidden="true">✦</span><span className="matchbox-stamp">{icon}</span><span className="matchbox-content"><strong>{title}</strong><small>{caption}</small></span><span className="matchbox-arrow">↗</span><span className="matchbox-stripe" /></button>;
}

function SteamSearchPanel() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SteamGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();
    if (query.length < 2) {
      setMessage("請至少輸入 2 個字元。");
      setResults([]);
      return;
    }

    setIsSearching(true);
    setMessage("");
    try {
      const response = await fetch(`/api/steam/search?term=${encodeURIComponent(query)}&limit=6`);
      const payload = await response.json() as { games?: SteamGame[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Steam 搜尋失敗");
      setResults(payload.games ?? []);
      if (!payload.games?.length) setMessage("找不到符合的 Steam 遊戲。");
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "目前無法取得 Steam 資料。");
    } finally {
      setIsSearching(false);
    }
  }

  return <section className="steam-search-panel" data-testid="steam-search-panel"><div className="steam-search-heading"><div><small>STEAM STORE</small><strong>想先看看 Steam 上有什麼？</strong></div><span>↗</span></div><form className="steam-search-form" onSubmit={search}><input data-testid="steam-search-input" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="搜尋遊戲名稱，例如 Hades" maxLength={80} /><button data-testid="steam-search-submit" type="submit" disabled={isSearching}>{isSearching ? "搜尋中…" : "搜尋"}</button></form>{message && <p className="steam-search-message" role="status">{message}</p>}{results.length > 0 && <div className="steam-results" data-testid="steam-results">{results.map((game) => <article className="steam-result-card" key={game.appId}>{game.coverUrl ? <img src={game.coverUrl} alt="" loading="lazy" /> : <div className="steam-result-placeholder">✦</div>}<div><strong>{game.name}</strong><small>{game.genres.slice(0, 2).join(" · ") || "Steam 遊戲"}</small><span>{game.priceRange}</span></div><a href={game.steamUrl} target="_blank" rel="noreferrer" aria-label={`在 Steam 查看 ${game.name}`}>↗</a></article>)}</div>}</section>;
}

function QuestionFlow({ question, index, total, value, onChoose, onNext, onBack }: { question: (typeof questions)[number]; index: number; total: number; value: string | string[]; onChoose: (value: string) => void; onNext: () => void; onBack: () => void }) {
  const selected = Array.isArray(value) ? value : [value];
  const labels = question.key === "session" ? Object.fromEntries(sessionOptions.map((item) => [item.value, `${item.label}｜${item.hint}`])) : question.key === "difficulty" ? Object.fromEntries(difficultyOptions.map((item) => [item.value, item.label])) : optionLabels;
  return <SceneFrame eyebrow={`MATCHSTICK ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`} title={question.title} className="question-frame"><p className="section-copy">{question.subtitle}</p><div className="progress-track"><span style={{ width: `${((index + 1) / total) * 100}%` }} /></div><div className={`option-grid ${question.multi ? "multi" : "single"}`}>{question.options.map((option) => <button key={option} className={`option-chip ${selected.includes(option) ? "selected" : ""}`} onClick={() => onChoose(option)}><span className="option-check">{selected.includes(option) ? "✓" : ""}</span>{labels[option] ?? option}</button>)}</div><div className="question-actions"><BackButton onClick={onBack} /><button className="primary-button" onClick={onNext}>{index === total - 1 ? "開始尋找" : "下一步"}<span>→</span></button></div><p className="hint">{question.multi ? "可複選" : "選擇一個最接近的答案"} 不確定也可以跳過</p></SceneFrame>;
}

function FreeTextInput({ value, onChange, onSubmit, isSubmitting, onBack }: { value: string; onChange: (value: string) => void; onSubmit: () => void | Promise<void>; isSubmitting: boolean; onBack: () => void }) {
  return <SceneFrame eyebrow="TELL ME ABOUT YOUR ADVENTURE" title={<>描述你的<br /><em>下一場冒險</em></>} className="free-text-frame"><p className="section-copy">不用想關鍵字 就像和朋友聊天一樣告訴我</p><div className="free-text-wrap"><div className="quote-mark">“</div><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="我想找一款可以一個人玩的遊戲，時間不用太長，氣氛放鬆、有探索感……" maxLength={300} disabled={isSubmitting} /><div className="char-count">{value.length} / 300</div></div><div className="example-pills"><span>試試看：</span><button onClick={() => onChange("想找一款可以和朋友一起玩的，輕鬆又好笑的遊戲")} disabled={isSubmitting}>和朋友一起玩</button><button onClick={() => onChange("我想要一個人沉浸在有故事感的探索遊戲，最好有繁體中文")} disabled={isSubmitting}>沉浸式探索</button></div><div className="question-actions"><BackButton onClick={onBack} /><button className="primary-button" onClick={onSubmit} disabled={!value.trim() || isSubmitting}>{isSubmitting ? "整理中…" : "點亮推薦"} <span>→</span></button></div><p className="hint">已支援 AI 結構化解析；未設定 API Key 時會自動使用本地分析</p></SceneFrame>;
}

function Analyzing({ notice }: { notice: string }) {
  return <SceneFrame eyebrow="A LITTLE SPARK IS ON ITS WAY" title={<>正在尋找你的<br /><em>第二人生</em></>} className="analyzing-frame"><div className="analysis-visual"><div className="analysis-flame">✦</div><div className="analysis-ring ring-one" /><div className="analysis-ring ring-two" /><div className="analysis-scan">SCANNING YOUR PLAY STYLE</div></div><p className="analysis-status">{notice}<span className="loading-dots">•••</span></p></SceneFrame>;
}

function traditionalChineseSupport(game: Game, type: "interface" | "subtitles" | "voice") {
  if (type === "interface") return game.traditionalChineseInterface ?? game.languages.includes("繁體中文");
  if (type === "subtitles") return game.traditionalChineseSubtitles ?? game.languages.includes("繁體中文");
  return game.traditionalChineseVoice ?? false;
}

function traditionalChineseSupportValue(game: Game, type: "interface" | "subtitles" | "voice") {
  return traditionalChineseSupport(game, type) ? "有" : "無";
}

function Results({ game, index, total, preferences, feedback, rating, favorite, onRate, onFavorite, onFeedback, onNext, onRestart, onEdit }: { game: Game; index: number; total: number; preferences: Preferences; feedback: FeedbackStatus | null; rating: number; favorite: boolean; onRate: (rating: number) => void; onFavorite: () => void; onFeedback: (status: FeedbackStatus) => void; onNext: () => void; onRestart: () => void; onEdit: () => void }) {
  const matchedTags = [...preferences.genres, ...preferences.moods, ...preferences.modes].filter((tag) => game.genres.includes(tag) || game.moods.includes(tag) || game.modes.includes(tag)).slice(0, 4);
  return <SceneFrame eyebrow={`YOUR MATCH ${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`} title={<>這一支火柴，<em>為你而亮</em></>} className="results-frame"><div className="result-layout"><div className={`game-cover ${game.coverClass}`} style={game.coverUrl ? { backgroundImage: `linear-gradient(rgba(28,47,77,.1), rgba(28,47,77,.42)), url(${game.coverUrl})` } : undefined}><span className="cover-label">GAME MATCH<br /><b>{game.source === "steam" ? "STEAM DISCOVERY" : "DISCOVERY EDITION"}</b></span></div><div className="game-info"><div className="game-kicker">MATCH FOUND <span>✦</span></div><h2>{game.nameZh}</h2><p className="game-en">{game.nameEn}</p><p className="game-description">{game.description}</p><div className="tag-row">{game.genres.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}{game.moods.slice(0, 2).map((tag) => <span key={tag} className="warm-tag">{tag}</span>)}</div><div className="recommend-reason"><span>✦</span><p>{buildVisibleReason(game, preferences, matchedTags)}</p></div>{game.steamUrl && <a className="steam-link" href={game.steamUrl} target="_blank" rel="noreferrer">在 Steam 查看 ↗</a>}</div></div><div className="detail-grid"><Detail label="遊玩方式" value={game.modes.join(" · ")} /><Detail label="遊玩時間" value={optionLabels[game.session] || "中等長度"} /><Detail label="支援平台" value={game.platforms.slice(0, 3).join(" · ")} /><Detail label="價格區間" value={game.priceRange} /><Detail label="遊戲難度" value={difficultyLabels[game.difficulty] || "有點挑戰"} /><Detail label="繁中介面" value={traditionalChineseSupportValue(game, "interface")} /><Detail label="繁中字幕" value={traditionalChineseSupportValue(game, "subtitles")} /><Detail label="繁中語音" value={traditionalChineseSupportValue(game, "voice")} /></div><div className="feedback-card"><div><strong>這根火柴適合你嗎？</strong><small>告訴我你的感覺，下次會更懂你。</small></div><div className="rating-row" aria-label="喜好評分">{[1, 2, 3, 4, 5].map((star) => <button key={star} className={rating >= star ? "rated" : ""} onClick={() => onRate(star)} aria-label={`${star} 分`}>★</button>)}</div><button className={`favorite-button ${favorite ? "active" : ""}`} onClick={onFavorite} aria-label="收藏">♡</button></div>{feedback ? <div className="feedback-saved"><span>✓</span> 已記住你的回饋 <button onClick={onNext}>換一根火柴 →</button></div> : <div className="feedback-actions"><button className="feedback-negative" onClick={() => onFeedback("disliked")}>玩過／不適合</button><button onClick={() => onFeedback("neutral")}>還不確定</button><button className="feedback-positive" onClick={() => onFeedback("liked")}>想試試看 ✦</button></div>}<div className="result-footer"><button onClick={onEdit}>修改偏好</button><button onClick={onRestart}>重新開始</button><button className="next-button" onClick={onNext}>下一款推薦 <span>→</span></button></div></SceneFrame>;
}

function buildVisibleReason(game: Game, preferences: Preferences, matchedTags: string[]) {
  if (matchedTags.length) return `因為你想要${matchedTags.join("、")}，這款遊戲的節奏與氛圍很適合現在的你。`;
  const matchedLanguages = preferences.language
    .filter((item) => item !== "語言不限")
    .filter((item) => item === "需要繁體中文介面" ? traditionalChineseSupport(game, "interface") : item === "需要繁體中文字幕" ? traditionalChineseSupport(game, "subtitles") : traditionalChineseSupport(game, "voice"))
    .map((item) => item.replace(/^需要/, ""));
  if (matchedLanguages.length) return `它支援${matchedLanguages.join("、")}，讓你可以更自在地進入這段遊戲旅程。`;
  return `這款${game.genres[0]}作品可能會帶你遇見一個原本沒想過的世界。`;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><small>{label}</small><strong>{value}</strong></div>; }
function BackButton({ onClick }: { onClick: () => void }) { return <button className="back-button" onClick={onClick}>← <span>返回</span></button>; }
function EmptyResults({ onRestart }: { onRestart: () => void }) { return <SceneFrame eyebrow="A QUIET LITTLE BOX" title={<>火柴盒裡<br /><em>還需要一點空間</em></>}><p className="section-copy">目前的條件太嚴格了，試著放寬一個偏好吧。</p><button className="primary-button" onClick={onRestart}>重新開始 <span>→</span></button></SceneFrame>; }
