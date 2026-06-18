import { Navigation } from "@/components/Navigation";
import { Blog } from "@/components/Blog";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { getBlogPosts, getCategories } from "@/lib/mdx";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDict(lang as Language);
  const ogImage = `${siteUrl}/og-default.png`;

  return {
    title: dict.blog.title || "Blog",
    description: dict.blog.description,
    openGraph: {
      title: dict.blog.title || "Blog",
      description: dict.blog.description,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      url: `${siteUrl}/${lang}/blog`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.blog.title || "Blog",
      description: dict.blog.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `${siteUrl}/${lang}/blog`,
      languages: {
        en: `${siteUrl}/en/blog`,
        zh: `${siteUrl}/zh/blog`,
        "x-default": `${siteUrl}/en/blog`,
      },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDict(lang as Language);
  const categories = await getCategories(lang);

  const allPosts = await getBlogPosts();
  const filteredPosts = allPosts.filter((post) => post.lang === lang);

  const posts = filteredPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: new Date(post.createdAt).toLocaleDateString(
      lang === "zh" ? "zh-CN" : "en-US"
    ),
    summary: post.summary,
    icon: post.icon,
    cover: post.cover,
    category: post.category,
    lang: lang,
  }));

  return (
    <main className="bg-background min-h-screen">
      <Navigation lang={lang as Language} dict={dict} />
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {dict.blog.title}
          </h1>
          <p className="text-slate-400 mb-10">
            {dict.blog.description}
          </p>

          <Blog
            title=""
            posts={posts}
            categories={categories}
            viewAllLabel={dict.blog.viewAll}
            allLabel={dict.blog.all}
            viewsLabel={dict.blog.views}
            searchPlaceholder={dict.blog.search}
          />
        </div>
      </div>
    </main>
  );
}
