import { Navigation } from "@/components/Navigation";

import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Skills } from "@/components/Skills";
import { Projects } from "@/components/Projects";
import { Blog } from "@/components/Blog";
import { Contact } from "@/components/Contact";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { resumeData } from "@/content/resume/data";
import { projects } from "@/content/resume/projects";
import { getAllPosts } from "@/lib/mdx";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDict(lang as Language);
  const data = resumeData[lang as Language];
  const projectList = projects[lang as Language];
  const allPosts = await getAllPosts();
  const langPosts = allPosts.filter((post) => post.lang === lang);
  const posts = langPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: new Date(post.createdAt).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US"),
    summary: post.summary,
    icon: post.icon,
    cover: post.cover,
    lang: post.lang,
  }));

  return (
    <main className="bg-background min-h-screen">
      <Navigation lang={lang as Language} dict={dict} />
      <Hero
        name={data.name}
        title={data.title}
        subtitle={data.summary}
        cta={dict.hero.cta}
        label={dict.hero.label}
      />
      <About
        title={dict.about.title}
        content={data.summary}
        stats={data.stats}
        statLabels={dict.about.stats}
      />
      <Experience title={dict.experience.title} items={data.experience} />
      <Skills title={dict.skills.title} items={data.skills} />
      <Projects title={dict.projects.title} items={projectList} />
      <Blog
        title={dict.blog.title}
        posts={posts}
        viewAllLabel={dict.blog.viewAll}
      />
      <Contact
        title={dict.contact.title}
        email={data.email}
        github="Josephchen-crypto"
        linkedin="josephchen1990"
        copied={dict.contact.copied}
        description={dict.contact.description}
        cta={dict.contact.cta}
        copyright={dict.contact.copyright}
      />
    </main>
  );
}
