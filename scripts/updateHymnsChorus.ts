import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type HymnJSON = {
  title: string;
  verses: unknown;
  chorus?: unknown;
  formated?: boolean;
};

async function main() {
  const filePath = path.join(
    process.cwd(),
    "app",
    "data",
    "tasbe7naDB.json"
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  const hymns = JSON.parse(raw) as HymnJSON[];

  for (const hymn of hymns) {
    await prisma.hymn.updateMany({
      where: {
        title: hymn.title,
      },
      data: {
        verses: hymn.verses as Prisma.InputJsonValue,
        chorus: hymn.chorus
          ? (hymn.chorus as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        formatted: hymn.formated ?? false,
      },
    });
  }

  console.log("✅ Hymns updated successfully (chorus fixed)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());