import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { resumeData } from "@/content/resume/data";
import { projects } from "@/content/resume/projects";
import { Github, Linkedin, Mail, MapPin } from "lucide-react";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const data = resumeData[language];
  const projectList = projects[language];
  const isZh = lang === "zh";

  return (
    <main className="min-h-screen bg-background">
      <Navigation lang={language} dict={dict} />
      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">// ABOUT / ENGINEERING TRACK</p>
          <h1>{data.name}</h1>
          <p>{data.summary}</p>
        </header>

        <section className="mk-about-profile">
          <img src="https://avatars.githubusercontent.com/u/4225592?v=4" alt={data.name} />
          <div className="mk-about-copy">
            <span>{data.title}</span>
            <h2>{isZh ? "重新构建技术地基，并把学习过程公开。" : "Rebuilding technical foundations in public."}</h2>
            <p>
              {isZh
                ? "长期 Android 开发经验正在与 JVM、Framework、性能、安全和 Crypto Wallet 重新连接。这个网站既是学习系统，也是公开的职业技术轨迹。"
                : "Long-term Android experience is being reconnected with JVM, Framework, performance, security, and Crypto Wallet engineering. This site is both a learning system and a public technical career trail."}
            </p>
            <div className="mk-about-links">
              <a href={`https://github.com/${data.social.github}`} target="_blank" rel="noreferrer"><Github size={14} />GitHub</a>
              <a href={`https://linkedin.com/in/${data.social.linkedin}`} target="_blank" rel="noreferrer"><Linkedin size={14} />LinkedIn</a>
              <a href={`mailto:${data.email}`}><Mail size={14} />Email</a>
              <span><MapPin size={14} />{data.location}</span>
            </div>
          </div>
        </section>

        <div className="mk-section-heading" style={{ marginTop: 26 }}>
          <div><span>PROJECT HISTORY</span><h2>{isZh ? "工程项目" : "Engineering Projects"}</h2></div>
        </div>

        <section className="mk-project-grid">
          {projectList.slice(0, 6).map((project) => (
            <article className="mk-project-card" key={project.name}>
              <small>{project.period}</small>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
              <div className="mk-stage-tags">
                {project.tech.map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </section>
      </div>
      <SiteFooter lang={language} />
      </main>
  );
}
