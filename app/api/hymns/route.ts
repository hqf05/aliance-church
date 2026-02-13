import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function GET(req: Request) {
  console.log("✅ DATABASE_URL =", process.env.DATABASE_URL);
const total = await prisma.hymn.count();
console.log("✅ Hymn count =", total);
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "5");
    const offsetParam = Number(searchParams.get("offset") ?? "0");

    const take = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 50)
      : 5;

    const skip = Number.isFinite(offsetParam)
      ? Math.max(offsetParam, 0)
      : 0;

    const takePlus = take + 1;

    // ✅ إذا ماكو بحث
    if (!q) {
      const rows = await prisma.hymn.findMany({
        take: takePlus,
        skip,
        orderBy: { title: "asc" },
      });

      const items = rows.slice(0, take);

      return NextResponse.json({
        items,
        hasMore: rows.length > take,
        nextOffset: skip + items.length,
      });
    }

    // ✅ بحث يبدأ بالحرف فقط
    const like = `${q}%`;

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
      WHERE ltrim(title) ILIKE ${like}
      ORDER BY ltrim(title) ASC
      LIMIT ${takePlus} OFFSET ${skip}
    `;

    const items = rows.slice(0, take);

    return NextResponse.json({
      items,
      hasMore: rows.length > take,
      nextOffset: skip + items.length,
    });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}