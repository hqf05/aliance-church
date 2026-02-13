import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req: Request) {
  
  try {
    
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "5");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 5;
    const skip = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    const takePlus = take + 1;

    // ✅ إذا ماكو q رجّع آخر ترانيم
    if (!q) {
      const rows = await prisma.hymn.findMany({
        select: { id: true, title: true, verses: true, chorus: true, formatted: true },
        orderBy: { id: "desc" },
        take: takePlus,
        skip,

      } );

      const items = rows.slice(0, take);
      return NextResponse.json({
        items,
        hasMore: rows.length > take,
        nextOffset: skip + items.length,
      });
    }

    // ✅ بحث Prefix: يبدي بالحرف/الكلمة (مع تجاهل المسافات بالبداية)
    const prefix = `${q}%`;

    const rows = await prisma.$queryRaw<
      { id: number; title: string; formatted: boolean }[]
    >`
      SELECT id, title, formatted
      FROM "Hymn"
      WHERE ltrim(title) ILIKE ${prefix}
      ORDER BY id ASC
      LIMIT ${takePlus} OFFSET ${skip}
    `;

    const items = rows.slice(0, take);

    return NextResponse.json({
      items,
      hasMore: rows.length > take,
      nextOffset: skip + items.length,
    });
  } catch (err) {
    console.error("API /api/hymns GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}