import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
export async function DELETE(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");
  
      if (!id) {
        return NextResponse.json(
          { error: "Missing id" },
          { status: 400 }
        );
      }
  
      await prisma.hymn.delete({
        where: { id: Number(id) },
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("❌ DELETE ERROR:", error);
      return NextResponse.json(
        { error: "Failed to delete hymn" },
        { status: 500 }
      );
    }
  }
export async function PUT(req: Request) {
    try {
      const body = await req.json();
      const { id, title, lyrics } = body;
  
      if (!id || !title || !lyrics) {
        return NextResponse.json(
          { error: "Missing fields" },
          { status: 400 }
        );
      }
  
      const hymn = await prisma.hymn.update({
        where: { id },
        data: {
          title,
          lyrics,
        },
      });
  
      return NextResponse.json(hymn);
    } catch (error) {
      console.error("❌ UPDATE ERROR:", error);
      return NextResponse.json(
        { error: "Failed to update hymn" },
        { status: 500 }
      );
    }
  }
// 🔹 GET: جلب كل الترانيم
export async function GET() {
  try {
    const hymns = await prisma.hymn.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(hymns);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch hymns" },
      { status: 500 }
    );
  }
}

// 🔹 POST: إضافة ترنيمة جديدة
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, lyrics } = body;

    if (!title || !lyrics) {
      return NextResponse.json(
        { error: "Missing title or lyrics" },
        { status: 400 }
      );
    }

    const hymn = await prisma.hymn.create({
      data: {
        title,
        lyrics,
      },
    });
    return NextResponse.json(hymn);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create hymn" },
      { status: 500 }
    );
  }
}