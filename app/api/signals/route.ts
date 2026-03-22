import { NextResponse } from "next/server";

const SUPABASE_URL = "https://odcdhadqufanxqozgwdb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY2RoYWRxdWZhbnhxb3pnd2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTI4ODksImV4cCI6MjA4OTYyODg4OX0.HtsPpKhpsSKjFt7IftoTGL1wwOsxS7QLg2WwiZ86ApA";

export const revalidate = 60;

export async function GET() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/signals?select=*&order=scanned_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return NextResponse.json({ signals: [] });
    const signals = await res.json();
    return NextResponse.json({ signals });
  } catch {
    return NextResponse.json({ signals: [] });
  }
}
