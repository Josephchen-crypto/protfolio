import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const stages = [
  {
    code: "01",
    zh: "JVM 地基",
    en: "JVM Foundations",
    zhDesc: "运行机制 → Runtime Areas → Object Creation → ClassFile → Class Loading → GC → JMM → Concurrency",
    enDesc: "Runtime model → Runtime Areas → Object Creation → ClassFile → Class Loading → GC → JMM → Concurrency",
    tags: ["JVM", "Java", "GC", "Concurrency"],
  },
  {
    code: "02",
    zh: "Android Framework",
    en: "Android Framework",
    zhDesc: "Handler / Looper → Activity 启动 → Binder → View / Window → Compose → Coroutines / Flow",
    enDesc: "Handler / Looper → Activity startup → Binder → View / Window → Compose → Coroutines / Flow",
    tags: ["Framework", "Binder", "UI", "Compose"],
  },
  {
    code: "03",
    zh: "性能、架构与工程化",
    en: "Performance & Architecture",
    zhDesc: "启动、卡顿、内存、网络、数据库、Gradle、模块化、DI 与工程稳定性。",
    enDesc: "Startup, jank, memory, networking, database, Gradle, modularization, DI and engineering stability.",
    tags: ["Performance", "Architecture", "Gradle"],
  },
  {
    code: "04",
    zh: "Web3 Wallet",
    en: "Web3 Wallet",
    zhDesc: "Account / Address → Private Key → Signing → HD Wallet → RPC → Transaction → Android Wallet 实战。",
    enDesc: "Account / Address → Private Key → Signing → HD Wallet → RPC → Transaction → Android Wallet practice.",
    tags: ["Wallet", "Signing", "RPC", "Security"],
  },
  {
    code: "05",
    zh: "职业能力汇合",
    en: "Career Convergence",
    zhDesc: "Senior Android + Wallet + Mobile Security，形成可用于 FinTech、Wallet 与海外远程岗位的能力组合。",
    enDesc: "Senior Android + Wallet + Mobile Security for FinTech, wallet engineering and remote roles.",
    tags: ["Career", "FinTech", "Remote"],
  },
];

export default async function LearningPathPage({
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
          <p className="mk-eyebrow">{"// LEARNING ROADMAP"}</p>
          <h1>{isZh ? "学习路径" : "Learning Path"}</h1>
          <p>
            {isZh
              ? "先恢复 Android 核心竞争力，再把 Wallet 与安全能力叠加上去。路线服务职业目标，不追求知识收集数量。"
              : "Rebuild Android depth first, then layer wallet and security skills on top. The roadmap serves career goals, not note collecting."}
          </p>
        </header>

        <section className="mk-roadmap-page">
          {stages.map((stage) => (
            <article className="mk-roadmap-stage" key={stage.code}>
              <div className="mk-stage-index">PHASE {stage.code}</div>
              <div className="mk-stage-body">
                <h2>{isZh ? stage.zh : stage.en}</h2>
                <p>{isZh ? stage.zhDesc : stage.enDesc}</p>
                <div className="mk-stage-tags">
                  {stage.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
      <SiteFooter lang={language} />
      </main>
  );
}
