import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("🔥 LOGIN API HIT");

  const body = await req.json();
  console.log("📦 BODY:", body);

  const { username, password } = body;

  if (username === "admin" && password === "1234") {
    const res = NextResponse.json({ success: true });

    res.cookies.set("admin-auth", "true", {
      httpOnly: true,
      path: "/",
    });

    return res;
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}