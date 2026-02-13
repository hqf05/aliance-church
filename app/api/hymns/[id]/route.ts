import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // مثال: /api/hymns/2731
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["api","hymns","2731"]
  const idStr = parts.at(-1) || "";

  console.log("✅ HIT /api/hymns/[id]");
  console.log("pathname =", url.pathname);
  console.log("idStr =", idStr);

  if (!/^\d+$/.test(idStr)) {
    return NextResponse.json(
      { error: "Bad id", got: idStr || null },
      { status: 400 }
    );
  }

  const id = Number(idStr);

  const hymn = await prisma.hymn.findUnique({ where: { id } });
  if (!hymn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(hymn);
}