import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ok } from "assert";
import fs from "fs";
import path from "path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPrisma() {
  const g = globalThis as unknown as { prisma?: PrismaClient };
  if (!g.prisma) g.prisma = new PrismaClient();
  return g.prisma;
}

export async function GET(req: NextRequest) {
  try {
    console.log("✅ /api/hymns HIT");
    const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    console.log("CWD =", process.cwd());
    console.log("Resolved DB Path =", dbPath);
    console.log("DB exists?", fs.existsSync(dbPath));
    if (fs.existsSync(dbPath)) {
      console.log("DB size =", fs.statSync(dbPath).size);
    }
    console.log("API DATABASE_URL =", process.env.DATABASE_URL);
    const prisma = getPrisma();
    const count = await prisma.hymn.count();
    console.log("Hymn count from API:", count);
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "5");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 5;
    const skip = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    // إذا ماكو بحث: رجّع آخر ترانيم
    if (!q) {
      const items = await prisma.hymn.findMany({
        take,
        skip,
        orderBy: { id: "desc" },
      });

      return NextResponse.json({
        items,
        hasMore: items.length === take,
        nextOffset: skip + items.length,
        ok:true ,count
      });
    }

    // ✅ بحث title فقط (startsWith)
    const items = await prisma.hymn.findMany({
      where: {
        title: { startsWith: q },
      },
      take,
      skip,
      orderBy: { id: "desc" },
    });

    return NextResponse.json({
      items,
      hasMore: items.length === take,
      nextOffset: skip + items.length,
    });
  } catch (err) {
    console.error("API /api/hymns GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}