import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type HymnJSON = {
  title: string;
  verses: string[][];
  chorus?: string[] | null;
  formated?: boolean;
};

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function main() {
  const filePath = path.join(process.cwd(), "app", "data", "tasbe7naDB.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const hymns: HymnJSON[] = JSON.parse(raw);
  const rows = hymns.map((h) => ({
    title: h.title,
    verses: h.verses as unknown as Prisma.InputJsonValue,
    chorus: (h.chorus ?? null) as unknown as Prisma.InputJsonValue,
    formatted: h.formated ?? false,
  }));
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);

    const r = await prisma.hymn.createMany({
      data: chunk,
      skipDuplicates: true, // ✅ هذا يخليها تكمل
    });
    console.log(`✅ inserted ${r.count} (batch ${i} → ${i + chunk.length})`);
  }
  console.log("🎉 DONE");
  // for (const hymn of hymns) {
  //   await prisma.hymn.create({
  //     data: {
  //       title: hymn.title,
  //       verses: toJson(hymn.verses),
  //       chorus: hymn.chorus ? toJson(hymn.chorus) : Prisma.DbNull, // ✅ هذا الصح
  //       formatted: hymn.formated ?? false,
  //     },
  //   });
  // }

  console.log("✅ Imported hymns (chorus ok)");
}


main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());