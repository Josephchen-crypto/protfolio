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
          />
        </div>
      </div>
    </main>
  );
}
