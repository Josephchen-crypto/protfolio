// Pre-generate cover images before the Cloudflare/OpenNext build.
// Run via: npx tsx scripts/generate-covers.ts

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateCover, ensureCoverDir } from "../lib/cover-generator";

const postsDir = path.join(process.cwd(), "content", "blog");
const coversDir = path.join(process.cwd(), "public", "covers");

async function main() {
  console.log("🎨 Pre-generating blog cover images...\n");
  await ensureCoverDir();

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  let generated = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data } = matter(raw);
    const slug = file.replace(/\.md$/, "");
    const cover = (data.cover as string) || "";

    if (cover && cover.startsWith("http")) {
      skipped++;
      continue;
    }

    const pngPath = path.join(coversDir, `${slug}.png`);
    if (fs.existsSync(pngPath)) {
      console.log(`  ⏭️  ${slug} (exists)`);
      skipped++;
      continue;
    }

    try {
      const png = await generateCover({
        title: (data.title as string) || slug,
        summary: (data.summary as string) || "",
        category: (data.category as string) || "",
        date: (data.date as string) || "",
        lang: (data.lang as "en" | "zh") || "en",
      });
      fs.writeFileSync(pngPath, png);
      console.log(`  ✅ ${slug}`);
      generated++;
    } catch (e) {
      console.error(`  ⚠️  ${slug} failed:`, e);
    }
  }

  console.log(`\n✅ Done. ${generated} generated, ${skipped} skipped.`);
}

main().catch(console.error);
