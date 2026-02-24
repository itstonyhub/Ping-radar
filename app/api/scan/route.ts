import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ApiTweet = {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  author_username?: string | null;
  author_name?: string | null;
  author_profile_image_url?: string | null;
  author_verified?: boolean | null;
  url?: string;
};

const DEFAULT_QUERY =
  '(airdrop OR allocation OR eligibility OR eligible OR "check eligibility" OR "check allocation" OR "claim live")';

export async function GET(req: Request) {
  try {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing X_BEARER_TOKEN env var" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const qRaw = searchParams.get("q");

    const limit = Math.max(
      1,
      Math.min(50, Number.parseInt(limitRaw ?? "20", 10) || 20)
    );
    const query = (qRaw && qRaw.trim().length > 0 ? qRaw.trim() : DEFAULT_QUERY).slice(
      0,
      512
    );

    const url = new URL("https://api.x.com/2/tweets/search/recent");
    url.searchParams.set("query", query);
    url.searchParams.set("max_results", String(Math.min(limit, 100)));
    url.searchParams.set("tweet.fields", "created_at,author_id");
    url.searchParams.set("expansions", "author_id");
    url.searchParams.set("user.fields", "username,name,profile_image_url,verified");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    // Se X risponde con rate limit / crediti finiti, NON far esplodere il sito:
    if (res.status === 429) {
      return NextResponse.json({
        ok: true,
        paused: false,
        tweets: [],
        message: "API X: rate limit (feed temporaneamente vuoto).",
      });
    }
    if (res.status === 402 || res.status === 403) {
      return NextResponse.json({
        ok: true,
        paused: false,
        tweets: [],
        message: "API X: crediti esauriti o accesso negato (feed temporaneamente vuoto).",
      });
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      // Mantieni JSON sempre, mai HTML
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          data: json,
        },
        { status: res.status }
      );
    }

    const users: any[] = json?.includes?.users ?? [];
    const usersById = new Map<string, any>(users.map((u: any) => [u.id, u]));

    const tweets: ApiTweet[] = (json?.data ?? []).map((t: any) => {
      const u = t.author_id ? usersById.get(t.author_id) : null;
      const username = u?.username ?? null;

      return {
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        author_id: t.author_id,
        author_username: username,
        author_name: u?.name ?? null,
        author_profile_image_url: u?.profile_image_url ?? null,
        author_verified: typeof u?.verified === "boolean" ? u.verified : null,
        url: username
          ? `https://x.com/${username}/status/${t.id}`
          : `https://x.com/i/status/${t.id}`,
      };
    });

    return NextResponse.json({
      ok: true,
      count: tweets.length,
      query,
      tweets,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
