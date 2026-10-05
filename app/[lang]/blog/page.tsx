import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
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
  const language = lang as Language;
  const dict = await getDict(language);
  const categories = await getCategories(lang);
  const allPosts = await getBlogPosts();
  const filteredPosts = allPosts.filter((post) => post.lang === lang);
  const isZh = lang === "zh";

  const posts = filteredPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: new Date(post.createdAt).toLocaleDateString(
      isZh ? "zh-CN" : "en-US"
    ),
    summary: post.summary,
    icon: post.icon,
    cover: post.cover,
    category: post.category,
    lang,
  }));

  return (
    <main className="mk-blog-page bg-background">
      <Navigation lang={language} dict={dict} />

      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">{"// LEARNING IN PUBLIC"}</p>
          <h1>{isZh ? "技术学习博客" : "Technical Learning Blog"}</h1>
          <p>
            {isZh
              ? "把学习过程公开沉淀成长期资产。这里记录 JVM、Android、Web3 Wallet、工程实践和职业重建。"
              : "Turning the learning process into a long-term public asset across JVM, Android, Web3 Wallet, engineering, and career rebuilding."}
          </p>
        </header>

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
      <SiteFooter lang={language} />
      </main>
  );
}
