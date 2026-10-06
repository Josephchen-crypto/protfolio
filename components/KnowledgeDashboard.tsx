import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Braces,
  Cpu,
  Github,
  Layers3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import type { Language } from "@/i18n/config";
import {
  androidFoundationMilestones,
  completedCount,
  jvmMilestones,
  progressPercent,
  securityStatus,
  secondaryTrackMilestones,
  walletMilestones,
  web3Milestones,
  web3WalletMilestones,
} from "@/lib/learning-progress";

type PostPreview = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  cover?: string | null;
  createdAt: string;
};

type DashboardProps = {
  lang: Language;
  name: string;
  title: string;
  summary: string;
  github: string;
  posts: PostPreview[];
};

const trackCopy = {
  zh: {
    eyebrow: "PERSONAL TECH LEARNING SYSTEM",
    title: "构建自己的技术认知体系",
    desc: "Android 主线 + Web3 Wallet 副线。这里不是文档仓库，而是持续学习、输出和验证能力的个人技术终端。",
    learning: "当前学习",
    latest: "最近知识",
    projects: "工程轨迹",
    profile: "个人档案",
    continue: "继续学习",
    browse: "进入知识库",
    primary: "主线",
    secondary: "副线",
    foundation: "从 JVM 地基进入 Android Framework、性能、安全与现代 UI。",
    wallet: "从账户、密钥、签名、RPC 开始，最终与 Android Wallet 工程能力汇合。",
  },
  en: {
    eyebrow: "PERSONAL TECH LEARNING SYSTEM",
    title: "Build a technical knowledge system",
    desc: "Android as the primary track, Web3 Wallet as the secondary track. This is a long-term learning terminal, not a document dump.",
    learning: "Current Learning",
    latest: "Latest Knowledge",
    projects: "Engineering Track",
    profile: "Profile",
    continue: "Continue learning",
    browse: "Browse knowledge",
    primary: "Primary",
    secondary: "Secondary",
    foundation: "From JVM foundations to Android Framework, performance, security, and modern UI.",
    wallet: "From accounts, keys, signing, and RPC to production Android Wallet engineering.",
  },
} as const;



export function KnowledgeDashboard({
  lang,
  name,
  title,
  summary,
  github,
  posts,
}: DashboardProps) {
  const copy = trackCopy[lang];
  const latestPosts = posts.slice(0, 5);
  const localizeSlug = (base: string) => lang === "zh" ? `${base}-zh` : base;

  const skillCards = [
    {
      key: "JVM",
      icon: Cpu,
      tone: "blue",
      progress: progressPercent(jvmMilestones),
      count: `${completedCount(jvmMilestones)}/${jvmMilestones.length}`,
      subtitle: "Runtime / Memory",
    },
    {
      key: "Android",
      icon: Smartphone,
      tone: "green",
      progress: progressPercent(androidFoundationMilestones),
      count: `${completedCount(androidFoundationMilestones)}/${androidFoundationMilestones.length}`,
      subtitle: "Framework / UI",
    },
    {
      key: "Web3",
      icon: Network,
      tone: "purple",
      progress: progressPercent(web3Milestones),
      count: `${completedCount(web3Milestones)}/${web3Milestones.length}`,
      subtitle: "Chain / Account",
    },
    {
      key: "Wallet",
      icon: WalletCards,
      tone: "pink",
      progress: progressPercent(walletMilestones),
      count: `${completedCount(walletMilestones)}/${walletMilestones.length}`,
      subtitle: "Signing / RPC",
    },
    {
      key: "Security",
      icon: ShieldCheck,
      tone: "cyan",
      progress: securityStatus.progress,
      count: securityStatus.label,
      subtitle: "Mobile / System",
    },
  ] as const;

  const primaryProgress = progressPercent(jvmMilestones);
  const primaryDone = completedCount(jvmMilestones);
  const secondaryProgress = progressPercent(secondaryTrackMilestones);
  const secondaryDone = completedCount(secondaryTrackMilestones);

  return (
    <>
      <section className="mk-hero">
        <div className="mk-hero-inner">
          <div className="mk-hero-copy">
            <p className="mk-eyebrow">{"// "}{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>{copy.desc}</p>
          </div>
          <div className="mk-hero-quote">
            <span>{lang === "zh" ? "好的学习系统，不是记住更多，而是理解更深。" : "A good learning system is not about remembering more. It is about understanding deeper."}</span>
            <small>Build a Second Brain for Tech</small>
          </div>
        </div>
      </section>

      <div className="mk-page">
        <section className="mk-skill-strip" aria-label="Learning domains">
          {skillCards.map(({ key, icon: Icon, tone, progress, count, subtitle }, index) => (
            <div className={`mk-skill-card mk-tone-${tone} ${index === 0 ? "is-active" : ""}`} key={key}>
              <div className="mk-skill-top">
                <span className="mk-skill-icon"><Icon size={19} /></span>
                <span>
                  <b>{key}</b>
                  <small>{subtitle}</small>
                </span>
                <ArrowRight size={15} className="mk-skill-arrow" />
              </div>
              <div className="mk-skill-progress"><span style={{ width: `${progress}%` }} /></div>
              <em>{count}</em>
            </div>
          ))}
        </section>

        <div className="mk-home-grid">
          <aside className="mk-left-panel">
            <div className="mk-panel-title"><BookOpenText size={15} /> {copy.learning}</div>
            <div className="mk-roadmap-group">
              <span className="mk-roadmap-heading"><Cpu size={14} /> Java / JVM</span>
              {jvmMilestones.map((item) =>
                item.slug ? (
                  <Link
                    key={item.id}
                    className={item.status === "current" ? "mk-roadmap-current" : undefined}
                    href={`/${lang}/blog/${localizeSlug(item.slug)}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.id}
                    className={item.status === "current" ? "mk-roadmap-current" : undefined}
                  >
                    {item.label}
                  </span>
                )
              )}
            </div>
            <div className="mk-roadmap-group">
              <span className="mk-roadmap-heading"><Network size={14} /> Web3 / Wallet</span>
              {web3WalletMilestones.slice(0, 3).map((item) =>
                item.slug ? (
                  <Link
                    key={item.id}
                    className={item.status === "current" ? "mk-roadmap-current" : undefined}
                    href={`/${lang}/blog/${localizeSlug(item.slug)}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.id}
                    className={item.status === "current" ? "mk-roadmap-current" : undefined}
                  >
                    {item.label}
                  </span>
                )
              )}
            </div>
            <Link className="mk-panel-link" href={`/${lang}/learning-path`}>{copy.browse}<ArrowRight size={13} /></Link>
          </aside>

          <main className="mk-home-main">
            <div className="mk-track-grid">
              <article className="mk-track-card">
                <div className="mk-track-kicker"><Braces size={14} /> {copy.primary}</div>
                <h2>Java / JVM <span>→</span> Android</h2>
                <p>{copy.foundation}</p>
                <div className="mk-track-meta">
                  <span>{primaryProgress}% · {primaryDone}/{jvmMilestones.length}</span>
                  <span>JVM FOUNDATION</span>
                </div>
                <div className="mk-track-progress"><span style={{ width: `${primaryProgress}%` }} /></div>
                <Link href={`/${lang}/blog/${localizeSlug("jmm-basics")}`}>{copy.continue}<ArrowRight size={14} /></Link>
              </article>

              <article className="mk-track-card mk-track-card-purple">
                <div className="mk-track-kicker"><WalletCards size={14} /> {copy.secondary}</div>
                <h2>Web3 <span>→</span> Crypto Wallet</h2>
                <p>{copy.wallet}</p>
                <div className="mk-track-meta">
                  <span>{secondaryProgress}% · {secondaryDone}/{secondaryTrackMilestones.length}</span>
                  <span>WALLET ENGINEERING</span>
                </div>
                <div className="mk-track-progress"><span style={{ width: `${secondaryProgress}%` }} /></div>
                <Link href={`/${lang}/knowledge`}>{copy.browse}<ArrowRight size={14} /></Link>
              </article>
            </div>

            <div className="mk-section-heading">
              <div>
                <span>RECENT KNOWLEDGE</span>
                <h2>{copy.latest}</h2>
              </div>
              <Link href={`/${lang}/knowledge`}>{copy.browse}<ArrowRight size={14} /></Link>
            </div>

            <div className="mk-post-list">
              {latestPosts.map((post, index) => (
                <Link className="mk-post-row" href={`/${lang}/blog/${post.slug}`} key={post.slug}>
                  <span className="mk-post-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mk-post-copy">
                    <small>{post.category || "TECH NOTE"}</small>
                    <b>{post.title}</b>
                    <p>{post.summary}</p>
                  </span>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </main>

          <aside className="mk-right-panel">
            <section className="mk-context-card">
              <div className="mk-context-title"><Layers3 size={14} /> CORE PRINCIPLES</div>
              <ul>
                <li>{lang === "zh" ? "先建立心智模型，再深入源码。" : "Build the mental model before diving into source."}</li>
                <li>{lang === "zh" ? "知识必须连接真实 Android 场景。" : "Connect knowledge to real Android scenarios."}</li>
                <li>{lang === "zh" ? "一次只推进一个主要问题。" : "Advance one major problem at a time."}</li>
                <li>{lang === "zh" ? "学习结果持续公开输出。" : "Keep learning outcomes public."}</li>
              </ul>
            </section>

            <section className="mk-context-card mk-profile-mini">
              <div className="mk-context-title"><LockKeyhole size={14} /> {copy.profile}</div>
              <div className="mk-profile-head">
                <img src="https://avatars.githubusercontent.com/u/4225592?v=4" alt={name} />
                <div><b>{name}</b><small>{title}</small></div>
              </div>
              <p>{summary}</p>
              <a href={`https://github.com/${github}`} target="_blank" rel="noreferrer"><Github size={13} /> GitHub</a>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
