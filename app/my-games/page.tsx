"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import BackgroundMusic from "../components/BackgroundMusic";
import { mapDatabaseGame } from "../../lib/catalog";
import type { Game } from "../../lib/games";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import type { HistoryItem } from "../../lib/recommender";

type FilterKey = "all" | "favorite" | "liked" | "neutral" | "disliked" | "rated";
type MyGameItem = HistoryItem & { game: Game };
type FeedbackRow = {
  game_id: string;
  status: HistoryItem["status"];
  rating: number;
  favorite: boolean;
  updated_at?: string | null;
};

const statusLabels: Record<HistoryItem["status"], string> = {
  liked: "想試試看",
  neutral: "還不確定",
  disliked: "玩過／不適合",
};

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部紀錄" },
  { key: "favorite", label: "我的收藏" },
  { key: "liked", label: "想試試看" },
  { key: "neutral", label: "還不確定" },
  { key: "disliked", label: "玩過／不適合" },
  { key: "rated", label: "已評分" },
];

export default function MyGamesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(!isSupabaseConfigured || !supabase);
  const [items, setItems] = useState<MyGameItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthResolved(true);
      setIsLoading(false);
      return;
    }

    const client = supabase;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setAuthResolved(true);
    });

    const { data: authState } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthResolved(true);
    });

    return () => {
      active = false;
      authState.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !supabase) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const client = supabase;
    const userId = user.id;
    let active = true;
    setIsLoading(true);
    setMessage("");

    async function loadMyGames() {
      const feedbackResult = await client
        .from("game_feedback")
        .select("game_id,status,rating,favorite,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!active) return;
      if (feedbackResult.error) {
        setMessage("目前無法讀取你的遊戲紀錄，請稍後再試。 ");
        setIsLoading(false);
        return;
      }

      const rows = (feedbackResult.data ?? []).filter(isFeedbackRow);
      const ids = [...new Set(rows.map((row) => row.game_id))];
      if (ids.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      const gamesResult = await client.from("games").select("*").in("id", ids);
      if (!active) return;
      if (gamesResult.error) {
        setMessage("目前無法讀取遊戲資料，請稍後再試。 ");
        setIsLoading(false);
        return;
      }

      const gameMap = new Map<string, Game>(
        (gamesResult.data ?? [])
          .map((row) => mapDatabaseGame(row))
          .filter((game): game is Game => game !== null)
          .map((game) => [game.id, game]),
      );
      const nextItems = rows
        .map((row): MyGameItem | null => {
          const game = gameMap.get(row.game_id);
          if (!game) return null;
          return {
            gameId: row.game_id,
            status: row.status,
            rating: row.rating,
            favorite: row.favorite,
            updatedAt: row.updated_at ?? new Date(0).toISOString(),
            game,
          };
        })
        .filter((item): item is MyGameItem => item !== null);
      setItems(nextItems);
      setIsLoading(false);
    }

    void loadMyGames();
    return () => {
      active = false;
    };
  }, [user]);

  const visibleItems = useMemo(() => items.filter((item) => {
    if (activeFilter === "favorite") return item.favorite;
    if (activeFilter === "rated") return item.rating > 0;
    if (activeFilter === "liked" || activeFilter === "neutral" || activeFilter === "disliked") return item.status === activeFilter;
    return true;
  }), [activeFilter, items]);

  const favoriteCount = items.filter((item) => item.favorite).length;
  const ratedItems = items.filter((item) => item.rating > 0);
  const averageRating = ratedItems.length ? (ratedItems.reduce((total, item) => total + item.rating, 0) / ratedItems.length).toFixed(1) : "—";

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function updateItem(item: MyGameItem, patch: Partial<Pick<HistoryItem, "status" | "rating" | "favorite">>) {
    if (!supabase || !user || savingId) return;
    const previous = items;
    const nextItem = { ...item, ...patch, updatedAt: new Date().toISOString() };
    setItems((current) => current.map((entry) => entry.game.id === item.game.id ? nextItem : entry));
    setSavingId(item.game.id);
    setMessage("");

    const { error } = await supabase.from("game_feedback").upsert({
      user_id: user.id,
      game_id: item.game.id,
      status: nextItem.status,
      rating: nextItem.rating,
      favorite: nextItem.favorite,
    }, { onConflict: "user_id,game_id" });

    if (error) {
      setItems(previous);
      setMessage("更新失敗，請稍後再試。 ");
    }
    setSavingId(null);
  }

  async function removeItem(item: MyGameItem) {
    if (!supabase || !user || savingId || !window.confirm(`要清除「${item.game.nameZh}」的紀錄嗎？`)) return;
    const previous = items;
    setItems((current) => current.filter((entry) => entry.game.id !== item.game.id));
    setSavingId(item.game.id);
    setMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("登入狀態已失效，請重新登入。 ");

      const response = await fetch("/api/feedback", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: item.game.id }),
      });
      const payload = await response.json() as { deleted?: unknown; error?: string };
      if (!response.ok || payload.deleted !== 1) throw new Error(payload.error || "清除失敗，請稍後再試。 ");

      removeLocalHistoryItem(item.game.id);
    } catch (error) {
      setItems(previous);
      setMessage(error instanceof Error ? error.message : "清除失敗，請稍後再試。 ");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="app-shell my-games-shell">
      <Snowfall />
      <BackgroundMusic />
      <header className="topbar">
        <a className="brand" href="/" aria-label="回到首頁"><span className="brand-mark">✦</span><span>GAME MATCH</span><small>遊戲火柴</small></a>
        <div className="topbar-note"><span className="status-dot" /> 收藏你的下一段旅程</div>
        {user && <div className="auth-controls"><span className="auth-signed-in"><span className="status-dot" />{user.email?.split("@")[0] || "已登入"}</span><button className="auth-button" type="button" onClick={signOut}>登出</button></div>}
      </header>

      <section className="scene-frame my-games-frame">
        <div className="eyebrow"><span /> YOUR GAME SHELF <span /></div>
        <h1>你的遊戲，<em>都在這裡</em></h1>
        <p className="section-copy">重新看看曾經點亮的選擇，也可以隨時改變心意。</p>

        {!isSupabaseConfigured && <EmptyState title="尚未連接雲端資料庫" description="完成 Supabase 設定後，這裡會保存你的遊戲紀錄。" actionLabel="回到首頁" actionHref="/" />}
        {isSupabaseConfigured && !authResolved && <div className="my-games-notice">正在確認登入狀態…</div>}
        {isSupabaseConfigured && authResolved && !user && <EmptyState title="登入後查看你的遊戲" description="登入帳號後，評分、收藏與回饋會在不同裝置間同步。" actionLabel="回到首頁登入" actionHref="/" />}
        {isSupabaseConfigured && user && <>
          <div className="my-games-stats">
            <div><strong>{items.length}</strong><span>遊戲紀錄</span></div>
            <div><strong>{favoriteCount}</strong><span>我的收藏</span></div>
            <div><strong>{ratedItems.length}</strong><span>已評分</span></div>
            <div><strong>{averageRating}</strong><span>平均分數</span></div>
          </div>
          <div className="my-games-filters" aria-label="遊戲紀錄篩選">
            {filters.map((filter) => <button key={filter.key} type="button" className={activeFilter === filter.key ? "active" : ""} onClick={() => setActiveFilter(filter.key)}>{filter.label}<small>{filter.key === "all" ? items.length : filter.key === "favorite" ? favoriteCount : filter.key === "rated" ? ratedItems.length : items.filter((item) => item.status === filter.key).length}</small></button>)}
          </div>
          {message && <p className="my-games-message" role="status">{message}</p>}
          {isLoading && <div className="my-games-notice">正在整理你的遊戲紀錄…</div>}
          {!isLoading && visibleItems.length === 0 && <div className="my-games-notice">這個分類目前還沒有遊戲。</div>}
          {!isLoading && visibleItems.length > 0 && <div className="my-games-list">{visibleItems.map((item) => <MyGameCard key={item.game.id} item={item} isSaving={savingId === item.game.id} onUpdate={updateItem} onRemove={removeItem} />)}</div>}
        </>}
        <a className="my-games-back" href="/">← 回到推薦頁</a>
      </section>
    </main>
  );
}

function MyGameCard({ item, isSaving, onUpdate, onRemove }: { item: MyGameItem; isSaving: boolean; onUpdate: (item: MyGameItem, patch: Partial<Pick<HistoryItem, "status" | "rating" | "favorite">>) => void | Promise<void>; onRemove: (item: MyGameItem) => void | Promise<void> }) {
  const { game } = item;
  return <article className="my-game-card"><div className={`my-game-cover ${game.coverClass}`} style={game.coverUrl ? { backgroundImage: `linear-gradient(rgba(28,47,77,.1), rgba(28,47,77,.42)), url(${game.coverUrl})` } : undefined}><span className="cover-label">GAME MATCH<br /><b>{game.source === "steam" ? "STEAM DISCOVERY" : "DISCOVERY EDITION"}</b></span></div><div className="my-game-content"><div className="my-game-kicker">{statusLabels[item.status]} <span>✦</span></div><h2>{game.nameZh}</h2><p className="my-game-en">{game.nameEn}</p><div className="tag-row">{game.genres.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}{game.moods.slice(0, 2).map((tag) => <span className="warm-tag" key={tag}>{tag}</span>)}</div><div className="my-game-edit-row"><span>你的評分</span><div className="my-game-rating" aria-label={`${game.nameZh} 的評分`}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" className={item.rating >= star ? "rated" : ""} aria-label={`評為 ${star} 分`} disabled={isSaving} onClick={() => onUpdate(item, { rating: star })}>★</button>)}</div><button type="button" className={`my-game-favorite ${item.favorite ? "active" : ""}`} aria-label={item.favorite ? "取消收藏" : "加入收藏"} disabled={isSaving} onClick={() => onUpdate(item, { favorite: !item.favorite })}>{item.favorite ? "♥" : "♡"}</button></div><div className="my-game-statuses" aria-label="修改遊戲回饋">{(Object.keys(statusLabels) as HistoryItem["status"][]).map((status) => <button key={status} type="button" className={item.status === status ? "active" : ""} disabled={isSaving} onClick={() => onUpdate(item, { status })}>{statusLabels[status]}</button>)}</div><div className="my-game-footer"><small>最後更新 {formatDate(item.updatedAt)}</small><button type="button" onClick={() => onRemove(item)} disabled={isSaving}>清除紀錄</button></div></div></article>;
}

function EmptyState({ title, description, actionLabel, actionHref }: { title: string; description: string; actionLabel: string; actionHref: string }) {
  return <div className="my-games-empty"><span>✦</span><h2>{title}</h2><p>{description}</p><a className="light-button" href={actionHref}>{actionLabel}<span className="arrow">→</span></a></div>;
}

function isFeedbackRow(value: unknown): value is FeedbackRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.game_id === "string" && (row.status === "liked" || row.status === "neutral" || row.status === "disliked") && typeof row.rating === "number" && typeof row.favorite === "boolean";
}

function formatDate(value: string) {
  if (!value || value === new Date(0).toISOString()) return "尚未更新";
  return new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" }).format(new Date(value));
}

function removeLocalHistoryItem(gameId: string) {
  try {
    const saved = window.localStorage.getItem("game-match-history");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return;
    const nextHistory = parsed.filter((item) => !(item && typeof item === "object" && (item as { gameId?: unknown }).gameId === gameId));
    window.localStorage.setItem("game-match-history", JSON.stringify(nextHistory));
  } catch {
    // Local storage is only a cache; the cloud deletion has already succeeded.
  }
}

function Snowfall() {
  return <div className="snowfall" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ "--x": `${(index * 47) % 100}%`, "--delay": `${(index % 8) * -1.4}s`, "--duration": `${8 + (index % 5)}s`, "--size": `${3 + (index % 4)}px` } as React.CSSProperties}>✦</i>)}</div>;
}
