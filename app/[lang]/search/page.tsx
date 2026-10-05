import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { KnowledgeSearch } from "@/components/KnowledgeSearch";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { getBlogPosts } from "@/lib/mdx";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const isZh = lang === "zh";
  const posts = (await getBlogPosts())
    .filter((post) => post.lang === lang)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      category: post.category,
      lang,
    }));

  return (
    <main className="min-h-screen bg-background">
      <Navigation lang={language} dict={dict} />
      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">{"// GLOBAL SEARCH"}</p>
          <h1>{isZh ? "搜索知识" : "Search Knowledge"}</h1>
          <p>
            {isZh
              ? "搜索技术文章、概念和知识域。后续可以继续扩展到项目、资源和工具。"
              : "Search technical articles, concepts, and learning domains. Projects, resources, and tools can be added later."}
          </p>
        </header>

        <KnowledgeSearch
          posts={posts}
          placeholder={isZh ? "输入 GC、ClassLoader、Wallet、Security..." : "Search GC, ClassLoader, Wallet, Security..."}
        />
      </div>
      <SiteFooter lang={language} />
      </main>
  );
}
