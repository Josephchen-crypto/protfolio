import { ArrowRight, Code2, ExternalLink, Github } from "lucide-react";

type Project = {
  name: string;
  period: string;
  description: string;
  tech: string[];
  link: string;
};

export function EngineeringSnapshot({
  lang,
  projects,
  years,
  github,
}: {
  lang: "en" | "zh";
  projects: Project[];
  years: string;
  github: string;
}) {
  const isZh = lang === "zh";
  const featured = projects.slice(0, 3);

  return (
    <section className="mk-engineering-snapshot" id="projects">
      <div className="mk-section-heading">
        <div>
          <span>ENGINEERING TRACK</span>
          <h2>{isZh ? "工程轨迹" : "Engineering Track"}</h2>
        </div>
        <a href={`/${lang}/about`}>
          {isZh ? "查看完整经历" : "View full profile"}
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="mk-engineering-grid">
        <article className="mk-engineering-profile">
          <div className="mk-engineering-icon"><Code2 size={20} /></div>
          <small>{isZh ? "长期技术主线" : "LONG-TERM TRACK"}</small>
          <h3>{years} {isZh ? "年移动端开发" : "years mobile development"}</h3>
          <p>
            {isZh
              ? "从 Android 项目经验重新向 JVM、Framework、性能、安全与 Wallet 工程收拢。"
              : "Reconnecting Android experience with JVM, Framework, performance, security, and wallet engineering."}
          </p>
          <a className="mk-engineering-link" href={`https://github.com/${github}`} target="_blank" rel="noreferrer">
            <Github size={13} /> GitHub
          </a>
        </article>

        <div className="mk-engineering-projects">
          {featured.map((project) => (
            <article className="mk-engineering-project" key={project.name}>
              <div className="mk-engineering-project-head">
                <span>{project.period}</span>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noreferrer" aria-label={project.name}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="mk-engineering-tags">
                {project.tech.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
