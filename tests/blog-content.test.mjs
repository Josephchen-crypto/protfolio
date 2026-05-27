import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const blogDirectory = path.join(process.cwd(), "content", "blog");
const files = fs
  .readdirSync(blogDirectory)
  .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"));

function getPostMeta(fileName) {
  const filePath = path.join(blogDirectory, fileName);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(raw);
  return data;
}

test("blog posts include required frontmatter fields", () => {
  assert.ok(files.length > 0, "content/blog should contain at least one post");

  for (const file of files) {
    const data = getPostMeta(file);

    assert.ok(data.title, `${file}: missing title`);
    assert.ok(data.date, `${file}: missing date`);
    assert.ok(data.summary, `${file}: missing summary`);
    assert.ok(data.lang, `${file}: missing lang`);
    assert.ok(
      data.lang === "en" || data.lang === "zh",
      `${file}: lang must be "en" or "zh"`
    );
  }
});

test("paired posts point to an existing sibling post", () => {
  const slugs = new Set(files.map((file) => file.replace(/\.(md|mdx)$/, "")));

  for (const file of files) {
    const data = getPostMeta(file);
    if (!data.paired) continue;

    assert.ok(slugs.has(data.paired), `${file}: paired "${data.paired}" not found`);
  }
});
