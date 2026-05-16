import { Navigation } from "@/components/Navigation";
import { Blog } from "@/components/Blog";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { getBlogPosts, getCategories } from "@/lib/mdx";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { lang } = await params;
  const { category } = await searchParams;
  const dict = await getDict(lang as Language);
  const categories = await getCategories(lang);

  const allPosts = await getBlogPosts();
  const filteredPosts = allPosts.filter((post) => post.lang === lang);
  const posts = category
    ? filteredPosts.filter((post) => post.category === category)
    : filteredPosts;

  const mappedPosts = posts.map((post) => ({
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
          <p className="text-slate-400 mb-8">
            {lang === "zh" ? "我的博客文章" : "My blog posts"}
          </p>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            <a
              href={`/${lang}/blog`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !category
                  ? "bg-primary text-white"
                  : "bg-surface border border-border text-slate-400 hover:text-white hover:border-primary/50"
              }`}
            >
              {lang === "zh" ? "全部" : "All"}
            </a>
            {categories.map((cat) => (
              <a
                key={cat.name}
                href={`/${lang}/blog?category=${encodeURIComponent(cat.name)}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat.name
                    ? "bg-primary text-white"
                    : "bg-surface border border-border text-slate-400 hover:text-white hover:border-primary/50"
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-60">({cat.count})</span>
              </a>
            ))}
          </div>

          <Blog
            title=""
            posts={mappedPosts}
            viewAllLabel={dict.blog.viewAll}
          />
        </div>
      </div>
    </main>
  );
}
