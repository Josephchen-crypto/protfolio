import { Navigation } from "@/components/Navigation";
import { getDict, type Language } from "@/i18n";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ lang: post.lang, slug: post.slug }));
}

const readingTime = (html: string): string => {
  const words = html.replace(/<[^>]*>/g, "").trim();
  const count = words.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(count / 200));
  return `${minutes} min read`;
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const dict = await getDict(lang as Language);
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <main className="bg-background min-h-screen">
        <Navigation lang={lang as Language} dict={dict} />
        <div className="pt-32 pb-24 px-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft size={16} />
              {lang === "zh" ? "返回博客" : "Back to Blog"}
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white mb-4">
              {lang === "zh" ? "文章未找到" : "Post Not Found"}
            </h1>
            <p className="text-slate-400">
              {lang === "zh" ? "抱歉，这篇文章不存在。" : "Sorry, this post does not exist."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString(
    lang === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const readTime = readingTime(post.content);

  return (
    <main className="bg-background min-h-screen">
      <Navigation lang={lang as Language} dict={dict} />
      <article>
        {/* Hero section */}
        <div className="relative pt-24">
          {/* Cover image as full-width hero background */}
          {post.cover ? (
            <div className="absolute inset-0 h-[70vh]">
              <img
                src={post.cover}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/60 to-background" />
            </div>
          ) : (
            <div className="absolute inset-0 h-[55vh] bg-gradient-to-b from-primary/5 via-neon-purple/5 to-transparent" />
          )}

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-16 md:pb-24 text-center">
            <Link
              href={`/${lang}/blog`}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-12 transition-colors text-sm"
            >
              <ArrowLeft size={14} />
              {lang === "zh" ? "返回博客" : "Back to Blog"}
            </Link>

            {post.icon && (
              <div className="flex justify-center mb-8">
                {post.icon.length > 2 ? (
                  <img
                    src={post.icon}
                    alt=""
                    className="w-20 h-20 rounded-2xl shadow-2xl shadow-primary/10 ring-2 ring-white/10"
                  />
                ) : (
                  <span className="text-7xl md:text-8xl drop-shadow-2xl">
                    {post.icon}
                  </span>
                )}
              </div>
            )}

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6 drop-shadow-lg">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} />
                {formattedDate}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{readTime}</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
          <div className="prose prose-invert prose-lg max-w-none">
            <div
              className="text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </div>
      </article>
    </main>
  );
}