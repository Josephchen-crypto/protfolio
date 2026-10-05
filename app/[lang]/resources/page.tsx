import { Navigation } from "@/components/Navigation";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { BookOpenText, ExternalLink, FileCode2, Network, Smartphone, Video } from "lucide-react";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const items = [
  {
    type: "OFFICIAL",
    icon: FileCode2,
    title: "Java Virtual Machine Specification",
    zh: "JVM 运行时数据区、ClassFile、类加载等权威定义。",
    en: "Authoritative definitions for runtime areas, ClassFile, class loading, and JVM behavior.",
    href: "https://docs.oracle.com/javase/specs/jvms/se26/html/",
  },
  {
    type: "ANDROID",
    icon: Smartphone,
    title: "Android Developers",
    zh: "Framework、性能、Compose、安全与构建系统的一手资料。",
    en: "Primary documentation for Android Framework, performance, Compose, security, and build tooling.",
    href: "https://developer.android.com/",
  },
  {
    type: "AOSP",
    icon: BookOpenText,
    title: "Android Open Source Project",
    zh: "进入 Framework、ART、Binder 与系统源码阶段时使用。",
    en: "Use when moving into Framework, ART, Binder, and platform source.",
    href: "https://source.android.com/",
  },
  {
    type: "WEB3",
    icon: Network,
    title: "Ethereum Developer Docs",
    zh: "账户、交易、节点、JSON-RPC 与钱包工程的基础资料。",
    en: "Foundations for accounts, transactions, nodes, JSON-RPC, and wallet engineering.",
    href: "https://ethereum.org/developers/docs/",
  },
  {
    type: "VIDEO",
    icon: Video,
    title: "Visual Learning Queue",
    zh: "用高质量视频补足抽象概念的直觉，但不替代主笔记。",
    en: "Use high-quality video to build intuition for abstract topics without replacing the main note.",
    href: "https://www.youtube.com/",
  },
] as const;

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const isZh = lang === "zh";

  return (
    <main className="min-h-screen bg-background">
      <Navigation lang={language} dict={dict} />
      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">// CURATED RESOURCES</p>
          <h1>{isZh ? "精选学习资源" : "Curated Resources"}</h1>
          <p>
            {isZh
              ? "官方资料优先，博客和视频负责把抽象知识讲得更容易理解。资源少而精，不做链接仓库。"
              : "Primary sources first. Articles and videos are used to make abstract concepts easier to understand, not to create a link dump."}
          </p>
        </header>

        <section className="mk-resource-grid">
          {items.map(({ type, icon: Icon, title, zh, en, href }) => (
            <a className="mk-resource-card" href={href} target="_blank" rel="noreferrer" key={title}>
              <div className="mk-resource-top">
                <span className="mk-domain-icon"><Icon size={18} /></span>
                <span className="mk-resource-type">{type}</span>
                <ExternalLink size={14} />
              </div>
              <h2>{title}</h2>
              <p>{isZh ? zh : en}</p>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
