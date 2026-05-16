import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const blogDirectory = path.join(process.cwd(), "content/blog");

export interface MDXPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  icon: string | null;
  cover: string | null;
  category: string;
  lang: "en" | "zh";
  published: boolean;
  createdAt: string;
}

export interface CategoryMeta {
  name: string;
  count: number;
}

function getAllRawPosts(): Array<{
  slug: string;
  data: Record<string, unknown>;
  content: string;
}> {
  const files = fs.readdirSync(blogDirectory);

  return files
    .filter((file) => file.endsWith(".md") || file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.(md|mdx)$/, "");
      const filePath = path.join(blogDirectory, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      return { slug, data, content };
    });
}

async function renderMarkdown(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return String(result);
}

export async function getAllPosts(): Promise<MDXPost[]> {
  const rawPosts = getAllRawPosts();

  const posts = await Promise.all(
    rawPosts.map(async ({ slug, data, content }) => {
      const html = await renderMarkdown(content);

      return {
        slug,
        title: (data.title as string) || slug,
        date: (data.date as string) || "",
        summary: (data.summary as string) || "",
        content: html,
        icon: (data.icon as string) || null,
        cover: (data.cover as string) || null,
        category: (data.category as string) || "",
        lang: (data.lang as "en" | "zh") || "en",
        published: data.published !== false,
        createdAt: (data.date as string) || "",
      };
    })
  );

  return posts
    .filter((p) => p.published)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getBlogPosts(): Promise<MDXPost[]> {
  return getAllPosts();
}

export async function getBlogPost(slug: string): Promise<MDXPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function getCategories(lang: string): Promise<CategoryMeta[]> {
  const posts = await getAllPosts();
  const langPosts = posts.filter(
    (p) => p.lang === lang && p.category
  );
  const map = new Map<string, number>();
  for (const p of langPosts) {
    map.set(p.category, (map.get(p.category) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
