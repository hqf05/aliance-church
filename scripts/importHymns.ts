import { PrismaClient,Prisma } from "@prisma/client";
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
        verses:hymn.verses as Prisma.InputJsonValue,             // ✅ Array of arrays
        chorus: hymn.chorus
        ? (hymn.chorus as Prisma.InputJsonValue)
        : Prisma.JsonNull,   // ✅ هذا هو السر
        formatted: hymn.formated ?? false,
      },
    });
  }

  console.log("✅ Hymns imported WITH chorus");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());