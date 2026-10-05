import { Navigation } from "@/components/Navigation";
import { KnowledgeDashboard } from "@/components/KnowledgeDashboard";
import { EngineeringSnapshot } from "@/components/EngineeringSnapshot";
import { SiteFooter } from "@/components/SiteFooter";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { resumeData } from "@/content/resume/data";
import { projects } from "@/content/resume/projects";
import { getAllPosts } from "@/lib/mdx";
import { siteUrl, siteName, siteDescription } from "@/lib/site";
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
  const otherLang = lang === "zh" ? "en" : "zh";
  return {
    title: {
      absolute: `${siteName} - ${lang === "zh" ? "个人技术学习博客" : "Personal Tech Learning Blog"}`,
    },
    description: siteDescription[lang as "en" | "zh"],
    openGraph: {
      locale: lang === "zh" ? "zh_CN" : "en_US",
      title: siteName,
      description: siteDescription[lang as "en" | "zh"],
      url: `${siteUrl}/${lang}`,
      images: [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription[lang as "en" | "zh"],
      images: [`${siteUrl}/og-default.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${lang}`,
      languages: {
        [lang]: `${siteUrl}/${lang}`,
        [otherLang]: `${siteUrl}/${otherLang}`,
        "x-default": `${siteUrl}/en`,
      },
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const data = resumeData[language];
  const projectList = projects[language];
  const allPosts = await getAllPosts();
  const posts = allPosts
    .filter((post) => post.lang === lang)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      category: post.category,
      cover: post.cover,
      createdAt: post.createdAt,
    }));

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    alternateName: lang === "zh" ? "陈德基" : "Joseph Chen",
    jobTitle: data.title,
    description: data.summary,
    email: data.email,
    url: siteUrl,
    sameAs: [
      `https://github.com/${data.social.github}`,
      `https://linkedin.com/in/${data.social.linkedin}`,
    ],
    knowsAbout: [
      "Android",
      "Java",
      "Kotlin",
      "JVM",
      "Mobile Architecture",
      "Web3 Wallet",
      "Mobile Security",
    ],
  };

  return (
    <main className="bg-background min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <Navigation lang={language} dict={dict} />

      <KnowledgeDashboard
        lang={language}
        name={data.name}
        title={data.title}
        summary={data.summary}
        github={data.social.github}
        posts={posts}
      />

      <EngineeringSnapshot
        lang={language}
        projects={projectList}
        years={data.stats.years}
        github={data.social.github}
      />

      <SiteFooter
        lang={language}
        email={data.email}
        github={data.social.github}
        linkedin={data.social.linkedin}
      />
    </main>
  );
}
