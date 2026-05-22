import { siteUrl } from "@/lib/site";
import { getAllPosts } from "@/lib/mdx";
import { languages } from "@/i18n/config";

export default async function sitemap() {
  const posts = await getAllPosts();

  const staticPages = languages.flatMap((lang) => [
    {
      url: `${siteUrl}/${lang}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/${lang}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ]);

  const blogPages = posts.map((post) => ({
    url: `${siteUrl}/${post.lang}/blog/${post.slug}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}
