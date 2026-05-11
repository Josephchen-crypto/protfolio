import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Language } from "@/i18n/config";

const blogDirectory = path.join(process.cwd(), "content/blog");

export async function getBlogPosts(lang: Language) {
  const files = fs.readdirSync(blogDirectory);

  const posts = files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const filePath = path.join(blogDirectory, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(content);

      return {
        slug,
        title: data.title,
        date: data.date,
        summary: data.summary,
        lang: data.lang,
      };
    });

  return posts.filter((post) => post.lang === lang);
}
