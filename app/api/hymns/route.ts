import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "10");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const take = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10;
    const skip = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

    // إذا ماكو q رجّع آخر ترانيم
    if (!q) {
      const rows = await prisma.hymn.findMany({
        take,
        skip,
        orderBy: { id: "desc" },
      });

      return NextResponse.json({
        items: rows,
        hasMore: rows.length === take,
        nextOffset: skip + rows.length,
      });
    }

    // ✅ Prefix search: يبدي بالحرف/الكلمة
    const likePrefix = `${q}%`; // "ب%"

    // نجيب عنصر زيادة حتى نعرف hasMore
    const takePlus = take + 1;

    type HymnRow = {
      id: number;
      title: string;
      verses: unknown;
      chorus: unknown;
      formatted: boolean;
      createdAt: Date;
      updatedAt: Date;
    };

    const rows = await prisma.$queryRaw<HymnRow[]>`
      SELECT id, title, verses, chorus, formatted, "createdAt", "updatedAt"
      FROM "Hymn"
      WHERE ltrim(title) ILIKE ${likePrefix}
      ORDER BY id DESC
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