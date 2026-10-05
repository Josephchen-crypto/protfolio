import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export function SiteFooter({
  lang,
  email,
  github,
  linkedin,
}: {
  lang: "en" | "zh";
  email: string;
  github: string;
  linkedin: string;
}) {
  const isZh = lang === "zh";

  return (
    <footer className="mk-site-footer">
      <div className="mk-site-footer-inner">
        <div>
          <b>MyKnowledge</b>
          <span>{isZh ? "持续学习，持续输出，持续构建自己的技术认知体系。" : "Keep learning, keep publishing, keep building the technical knowledge system."}</span>
        </div>

        <nav>
          <Link href={`/${lang}/knowledge`}>{isZh ? "知识库" : "Knowledge"}</Link>
          <Link href={`/${lang}/learning-path`}>{isZh ? "学习路径" : "Roadmap"}</Link>
          <Link href={`/${lang}/blog`}>{isZh ? "笔记" : "Notes"}</Link>
          <Link href={`/${lang}/about`}>{isZh ? "关于" : "About"}</Link>
        </nav>

        <div className="mk-footer-social">
          <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={15} /></a>
          <a href={`https://linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={15} /></a>
          <a href={`mailto:${email}`} aria-label="Email"><Mail size={15} /></a>
        </div>
      </div>
    </footer>
  );
}
