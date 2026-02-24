"use client";

import { useEffect, useMemo, useState } from "react";

type ApiTweet = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
};

type ApiResponse =
  | {
      ok: true;
      tweets: ApiTweet[];
      updatedAt?: string;
      count?: number;
    }
  | {
      ok: false;
      error?: string;
      status?: number;
      data?: any;
    };

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(1, Math.floor((now - t) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function xLink(tweetId: string) {
  // Non abbiamo lo username (solo author_id), quindi linkiamo al tweet via intent.
  // Se in futuro aggiungi username, lo cambiamo in https://x.com/{username}/status/{id}
  return `https://x.com/i/web/status/${tweetId}`;
}

export default function Page() {
  const [tweets, setTweets] = useState<ApiTweet[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const limit = 30;
  const refreshMs = 2 * 60 * 1000; // 2 minutes

  async function fetchFeed() {
    try {
      setStatus((s) => (s === "ok" ? "ok" : "loading"));
      setErrorMsg("");

      const res = await fetch(`/api/scan?limit=${limit}`, { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok || !("ok" in data) || data.ok === false) {
        const msg =
          (data as any)?.error ||
          (data as any)?.data?.title ||
          `API error (${res.status})`;
        setStatus("error");
        setErrorMsg(msg);
        return;
      }

      const arr = (data.tweets ?? []).slice(0, limit);
      setTweets(arr);
      setStatus("ok");
      setLastUpdated((data.updatedAt ? new Date(data.updatedAt) : new Date()).toISOString());
    } catch (e: any) {
      setStatus("error");
      setErrorMsg(e?.message ?? "Unknown error");
    }
  }

  useEffect(() => {
    fetchFeed();
    const t = setInterval(fetchFeed, refreshMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = tweets.length;

  const subtitle = useMemo(() => {
    return `Real-time airdrop signals from crypto X. Auto-refreshes every 2 minutes.`;
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_30%_10%,rgba(34,211,238,0.20),transparent_60%),radial-gradient(60%_60%_at_80%_20%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(80%_80%_at_50%_90%,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5 py-10">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
                <span className="text-cyan-300">⟡</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Airdrop <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300">Radar</span>
              </h1>
            </div>

            <p className="mt-2 text-sm text-white/70">{subtitle}</p>

            <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                <span className="text-cyan-200">Live</span>
              </div>

              <span className="text-white/40">•</span>

              <span>
                Last updated{" "}
                <span className="text-white/80">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-US") : "--:--"}
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <div className="text-xs text-white/60">Signals</div>
            <div className="mt-1 text-xl font-semibold">
              {status === "error" ? <span className="text-red-300">Error</span> : count}
            </div>
          </div>
        </div>

        {/* content */}
        <div className="mt-8 space-y-4">
          {status === "loading" && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
                <div className="text-sm text-white/70">Scanning for airdrops...</div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="text-sm font-medium text-red-200">API Error</div>
              <div className="mt-1 text-sm text-white/70">{errorMsg || "Something went wrong."}</div>
              <button
                onClick={fetchFeed}
                className="mt-4 inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
              >
                Retry
              </button>
            </div>
          )}

          {status === "ok" && tweets.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="text-sm text-white/70">No signals right now.</div>
              <div className="mt-1 text-xs text-white/50">This page will update automatically.</div>
            </div>
          )}

          {status === "ok" &&
            tweets.map((t) => (
              <article
                key={t.id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl transition hover:border-cyan-400/30 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_40px_rgba(168,85,247,0.10)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white/80">
                      {(t.author_id?.slice(0, 2) || "X").toUpperCase()}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="text-sm font-semibold text-white/90">Author</div>
                        <div className="text-xs text-white/50">@{t.author_id?.slice(0, 10) || "unknown"}</div>
                        <span className="text-white/30">•</span>
                        <div className="text-xs text-white/50">{timeAgo(t.created_at)}</div>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                        {t.text}
                      </p>
                    </div>
                  </div>

                  <a
                    href={xLink(t.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/15"
                    title="Open on X"
                  >
                    Open on X <span aria-hidden>↗</span>
                  </a>
                </div>
              </article>
            ))}
        </div>

        <div className="mt-10 text-center text-xs text-white/40">
          Public read-only feed. Auto-refresh enabled.
        </div>
      </div>
    </main>
  );
}

