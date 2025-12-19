import { chromium } from "playwright";
import fs from "fs";

const ARABIC_CHARS = [
  "ا","ب","ت","ث","ج","ح","خ","د","ر","س","ش",
  "ص","ط","ع","ف","ق","ك","ل","م","ن","ه","و","ي"
];

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 120,
  });

  const page = await browser.newPage();
  await page.goto("https://tasbe7na.com/app/", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForTimeout(6000);

  const searchInput = await page.waitForSelector("#srchBox");
  const hymnsMap = new Map();

  for (const ch of ARABIC_CHARS) {
    console.log(`🔍 Searching: ${ch}`);

    await searchInput.click();
    await searchInput.fill("");
    await searchInput.type(ch, { delay: 300 });

    // ⏎ اختَر أول نتيجة
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);

    // ⛔ طلع من وضع العرض
    await page.keyboard.press("Escape");
    await page.waitForTimeout(800);

    let lastTitle = "";

    for (let i = 0; i < 30; i++) {
      const hymn = await page.evaluate(() => {
        const title = document
          .querySelector("li.dragSign.lstSelected")
          ?.innerText
          ?.trim();

        const verses = Array.from(
          document.querySelectorAll("#presenter li")
        ).map(li =>
          li.innerText
            .split("\n")
            .map(t => t.trim())
            .filter(Boolean)
        );

        return { title, verses };
      });

      if (!hymn.title || hymn.verses.length === 0) break;
      if (hymn.title === lastTitle) break;

      lastTitle = hymn.title;

      if (!hymnsMap.has(hymn.title)) {
        hymnsMap.set(hymn.title, hymn);
        console.log(`✅ Saved: ${hymn.title}`);
      }

      // ⬇️ انتقل للترنيمة التالية
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1200);

      // ⛔ طلع من العرض مرة ثانية
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
    }
  }

  const hymns = [...hymnsMap.values()];
  fs.writeFileSync("hymns.json", JSON.stringify(hymns, null, 2), "utf-8");

  console.log("🎉 DONE");
  console.log(`📦 TOTAL HYMNS: ${hymns.length}`);

  await browser.close();
})();