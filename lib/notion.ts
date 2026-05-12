import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const BLOG_PAGE_IDS = process.env.NOTION_BLOG_PAGE_IDS?.split(",").map((id) => id.trim()) || [];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  icon: string | null;
  cover: string | null;
  lang: "en" | "zh";
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

function generateSlug(title: string, id: string): string {
  const shortId = id.replace(/-/g, "").slice(-8);
  const slugFromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slugFromTitle}-${shortId}`;
}

function getBlockText(block: any): string {
  const type = block.type;
  return block[type]?.rich_text?.map((rt: { plain_text: string }) => rt.plain_text).join("") || "";
}

function blockToHtml(block: any): string {
  const type = block.type;
  const text = getBlockText(block);

  switch (type) {
    case "heading_1":
      return `<h2 class="text-2xl font-bold text-white mt-8 mb-4">${text}</h2>`;
    case "heading_2":
      return `<h3 class="text-xl font-bold text-white mt-6 mb-3">${text}</h3>`;
    case "heading_3":
      return `<h4 class="text-lg font-semibold text-white mt-5 mb-2">${text}</h4>`;
    case "bulleted_list_item":
      return `<li class="text-slate-300 ml-4 mb-1">${text}</li>`;
    case "numbered_list_item":
      return `<li class="text-slate-300 ml-4 mb-1 list-decimal">${text}</li>`;
    case "to_do":
      return `<div class="text-slate-300 mb-1">${block[type]?.checked ? '☑' : '☐'} ${text}</div>`;
    case "code": {
      const lang = block[type]?.language || "";
      return `<pre class="bg-surface border border-border rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm text-slate-300">${text}</code></pre>`;
    }
    case "quote":
      return `<blockquote class="border-l-2 border-primary pl-4 my-4 text-slate-400 italic">${text}</blockquote>`;
    case "callout": {
      const emoji = block[type]?.icon?.emoji || "";
      return `<div class="bg-surface border border-border rounded-lg p-4 my-4 flex gap-3"><span>${emoji}</span><span class="text-slate-300">${text}</span></div>`;
    }
    case "image": {
      let src = "";
      const img = block[type];
      if (img?.type === "external") src = img.external.url;
      else if (img?.type === "file") src = img.file.url;
      return src ? `<img src="${src}" alt="${text}" class="rounded-lg my-6 max-w-full" />` : "";
    }
    case "divider":
      return `<hr class="border-border my-6" />`;
    default:
      // paragraph and everything else
      return text ? `<p class="text-slate-300 mb-4 leading-relaxed">${text}</p>` : "";
  }
}

function blocksToHtml(blocks: any[]): string {
  let html = "";
  let inList = false;

  for (const block of blocks) {
    const type = block.type;

    if (type === "bulleted_list_item") {
      if (!inList) {
        html += '<ul class="mb-4 space-y-1">';
        inList = true;
      }
      html += blockToHtml(block);
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += blockToHtml(block);
    }
  }

  if (inList) html += "</ul>";
  return html;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

async function collectChildPages(pageId: string, depth = 0): Promise<BlogPost[]> {
  const blocks = await notion.blocks.children.list({ block_id: pageId });
  const posts: BlogPost[] = [];

  for (const block of blocks.results) {
    if (!("type" in block) || block.type !== "child_page") continue;

    const childPageId = block.id;
    const page = (await notion.pages.retrieve({ page_id: childPageId })) as any;
    const title =
      page.properties?.title?.title?.[0]?.plain_text || "Untitled";
    const slug = generateSlug(title, childPageId);

    // Extract icon and cover
    let icon: string | null = null;
    if (page.icon) {
      if (page.icon.type === "emoji") icon = page.icon.emoji;
      else if (page.icon.type === "external") icon = page.icon.external.url;
      else if (page.icon.type === "file") icon = page.icon.file.url;
    }
    let cover: string | null = null;
    if (page.cover) {
      cover = page.cover.type === "external" ? page.cover.external.url : page.cover.file?.url || null;
    }

    // Extract content as HTML
    const pageBlocks = await notion.blocks.children.list({ block_id: childPageId });
    const contentHtml = blocksToHtml(pageBlocks.results);
    const plainText = stripHtml(contentHtml);

    posts.push({
      id: childPageId,
      title,
      slug,
      icon,
      cover,
      excerpt: plainText.substring(0, 150) + (plainText.length > 150 ? "..." : ""),
      content: contentHtml,
      lang: "en",
      published: true,
      createdAt: page.created_time,
      updatedAt: page.last_edited_time,
    });

    if (depth < 5) {
      const nested = await collectChildPages(childPageId, depth + 1);
      posts.push(...nested);
    }
  }

  return posts;
}

async function fetchPostsFromPage(pageId: string): Promise<BlogPost[]> {
  try {
    const posts = await collectChildPages(pageId);
    return posts;
  } catch (error) {
    console.error(`Error fetching posts from page ${pageId}:`, error);
    return [];
  }
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (BLOG_PAGE_IDS.length === 0) {
    console.warn("NOTION_BLOG_PAGE_IDS not configured");
    return [];
  }

  const allPosts: BlogPost[] = [];

  for (const pageId of BLOG_PAGE_IDS) {
    const posts = await fetchPostsFromPage(pageId);
    allPosts.push(...posts);
  }

  // Sort by creation date descending
  return allPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}