import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { getDict, type Language } from "@/i18n";
import { languages } from "@/i18n/config";
import { getAllPosts } from "@/lib/mdx";
import {
  ArrowRight,
  Cpu,
  Network,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

export async function generateStaticParams() {
  return languages.map((lang) => ({ lang }));
}

const domains = [
  { key: "JVM", icon: Cpu, art: "/myknowledge/cover-jvm.svg", descZh: "运行机制、内存、类加载、GC、JMM 与并发。", descEn: "Runtime, memory, class loading, GC, JMM and concurrency." },
  { key: "Android", icon: Smartphone, art: "/myknowledge/cover-android.svg", descZh: "Framework、UI、性能、架构、Compose 与工程实践。", descEn: "Framework, UI, performance, architecture, Compose and engineering." },
  { key: "Web3", icon: Network, art: "/myknowledge/cover-web3.svg", descZh: "区块链、账户、交易、节点与 RPC。", descEn: "Blockchain, accounts, transactions, nodes and RPC." },
  { key: "Wallet", icon: WalletCards, art: "/myknowledge/cover-web3.svg", descZh: "私钥、签名、HD Wallet 与移动端钱包工程。", descEn: "Private keys, signing, HD wallets and mobile wallet engineering." },
  { key: "Security", icon: ShieldCheck, art: "/myknowledge/cover-android.svg", descZh: "Android 安全、Keystore、密钥保护与系统设计。", descEn: "Android security, Keystore, secret protection and system design." },
] as const;

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const language = lang as Language;
  const dict = await getDict(language);
  const posts = (await getAllPosts()).filter((post) => post.lang === lang);
  const isZh = lang === "zh";

  const countFor = (key: string) =>
    posts.filter((p) =>
      [p.category, p.title, p.summary].join(" ").toLowerCase().includes(key.toLowerCase())
    ).length;

  return (
    <main className="min-h-screen bg-background">
      <Navigation lang={language} dict={dict} />
      <div className="mk-content-shell">
        <header className="mk-page-heading">
          <p className="mk-eyebrow">{"// KNOWLEDGE LIBRARY"}</p>
          <h1>{isZh ? "知识库" : "Knowledge Library"}</h1>
          <p>
            {isZh
              ? "按知识域组织长期技术学习，把博客文章、工程经验和下一步学习路径连接在一起。"
              : "Organize long-term technical learning by domain and connect articles, engineering experience, and next steps."}
          </p>
        </header>

        <section className="mk-card-grid">
          {domains.map(({ key, icon: Icon, art, descZh, descEn }) => (
            <article className="mk-domain-card" key={key}>
              <div className="mk-domain-art" style={{ backgroundImage: `url(${art})` }}>
                <div className="mk-domain-icon"><Icon size={18} /></div>
              </div>
              <h2>{key}</h2>
              <p>{isZh ? descZh : descEn}</p>
              <footer>
                <span>{String(countFor(key)).padStart(2, "0")} POSTS</span>
                <span>EXPLORE →</span>
              </footer>
            </article>
          ))}
        </section>

        <div className="mk-section-heading" style={{ marginTop: 28 }}>
          <div>
            <span>ALL NOTES</span>
            <h2>{isZh ? "全部学习文章" : "All learning articles"}</h2>
          </div>
        </div>

        <div className="mk-post-list">
          {posts.map((post, index) => (
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
      </div>
      <SiteFooter lang={language} />
      </main>
  );
}
