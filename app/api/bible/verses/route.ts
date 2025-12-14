import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://arabic-bible.onrender.com/api/json/books"
  );

  const data = await res.json();
  return NextResponse.json(data);
}