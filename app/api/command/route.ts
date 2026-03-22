import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://odcdhadqufanxqozgwdb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// POST — save command to Supabase, return { id }
export async function POST(req: NextRequest) {
  const { command } = await req.json();
  if (!command?.trim()) {
    return NextResponse.json({ error: "No command provided" }, { status: 400 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/commands`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify({ command: command.trim(), status: "pending" }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `DB error: ${err}` }, { status: 500 });
  }

  const rows = await res.json();
  const id = Array.isArray(rows) ? rows[0]?.id : rows?.id;
  if (!id) {
    return NextResponse.json({ error: "No id returned from DB" }, { status: 500 });
  }
  return NextResponse.json({ id });
}

// GET ?id=X — return { id, status, result }
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/commands?id=eq.${id}&select=id,status,result`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: "DB error" }, { status: 500 });
  const rows = await res.json();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
