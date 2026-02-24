import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.X_BEARER_TOKEN;

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing X_BEARER_TOKEN in .env.local" },
      { status: 500 }
    );
  }

  const url = "https://api.twitter.com/2/users/me";

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const text = await res.text();

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    data,
  });
}

