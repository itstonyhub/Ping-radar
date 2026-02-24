import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ApiTweet = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;

  author_username: string | null;
  author_name: string | null;
  author_profile_image_url: string | null;
  author_verified: boolean;

  url: string;
};

const DEFAULT_QUERY =
  '("snapshot" OR allocation OR eligibility OR eligible OR "check eligibility" OR "check allocation" OR "claim live")';

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
    const parsedLimit = parseInt(limitRaw ?? "20", 10);
    const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 10), 100);

    const query = searchParams.get("q") ?? DEFAULT_QUERY;

    const url = new URL("https://api.x.com/2/tweets/search/recent");
    url.searchParams.set("query", query);
    url.searchParams.set("max_results", String(limit));
    url.searchParams.set("tweet.fields", "created_at,author_id");
    url.searchParams.set("expansions", "author_id");
    url.searchParams.set("user.fields", "username,name,profile_image_url,verified");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 402) {
      return NextResponse.json({
        ok: true,
        paused: false,
        tweets: [],
        message: "API X: credits depleted (temporary empty feed).",
      });
    }

    if (res.status === 429) {
      return NextResponse.json({
        ok: true,
        paused: false,
        tweets: [],
        message: "API X: rate limit (temporary empty feed).",
      });
    }

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, data: json },
        { status: res.status }
      );
    }

    const users = (json?.includes?.users ?? []) as any[];
    const usersById = new Map<string, any>(users.map((u) => [u.id, u]));

    const data = (json?.data ?? []) as any[];

    const tweets: ApiTweet[] = data.map((t) => {
      const u = usersById.get(t.author_id);
      const username = u?.username ?? null;

      return {
        id: t.id,
        text: t.text,
        created_at: t.created_at,
        author_id: t.author_id,

        author_username: username,
        author_name: u?.name ?? null,
        author_profile_image_url: u?.profile_image_url ?? null,
        author_verified: u?.verified ?? false,

        url: username
          ? `https://x.com/${username}/status/${t.id}`
          : `https://x.com/i/status/${t.id}`,
      };
    });

    return NextResponse.json({ ok: true, count: tweets.length, query, tweets });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
