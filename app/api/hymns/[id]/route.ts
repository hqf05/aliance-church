import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params; // ✅ مهم: await

  if (!idStr || !/^\d+$/.test(idStr)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const id = Number(idStr);

  const hymn = await prisma.hymn.findUnique({ where: { id } });
  if (!hymn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(hymn);
}