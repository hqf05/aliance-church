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

  for (const hymn of hymns) {
    await prisma.hymn.create({
      data: {
        title: hymn.title,
        verses: toJson(hymn.verses),
        chorus: hymn.chorus ? toJson(hymn.chorus) : Prisma.DbNull, // ✅ هذا الصح
        formatted: hymn.formated ?? false,
      },
    });
  }

  console.log("✅ Imported hymns (chorus ok)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());