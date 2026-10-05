import Link from "next/link";
import { Cpu, Network, ShieldCheck, Smartphone } from "lucide-react";
import type { Language } from "@/i18n/config";

export function LearningSidebar({
  lang,
  currentSlug,
}: {
  lang: Language;
  currentSlug?: string;
}) {
  const localizeSlug = (base: string) => lang === "zh" ? `${base}-zh` : base;

  const groups = [
    {
      title: "Java / JVM",
      icon: Cpu,
      items: [
        ["android-runtime-from-source-to-art", "01 · Runtime model"],
        ["jvm-runtime-data-areas", "02 · Runtime data areas"],
        ["java-object-creation-jvm", "03 · Object creation"],
        ["jvm-class-file-bytecode", "04 · ClassFile / Bytecode"],
      ],
    },
    {
      title: "Android",
      icon: Smartphone,
      items: [
        ["android-development-tips", "01 · Android engineering"],
        ["yak-android-error-handling-architecture", "02 · Error architecture"],
        ["yak-android-payment-architecture-deep-dive", "03 · Payment architecture"],
      ],
    },
    {
      title: "Web3 / Wallet",
      icon: Network,
      items: [],
    },
    {
      title: "Security",
      icon: ShieldCheck,
      items: [],
    },
  ] as const;

  return (
    <aside className="mk-article-sidebar">
      <div className="mk-article-sidebar-title">
        <span>◈</span>
        {lang === "zh" ? "学习路径" : "Learning Path"}
      </div>
      {groups.map(({ title, icon: Icon, items }) => (
        <div className="mk-article-side-group" key={title}>
          <div className="mk-article-side-heading">
            <Icon size={13} />
            {title}
          </div>
          {items.length > 0 ? (
            items.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/${lang}/blog/${localizeSlug(slug)}`}
                className={currentSlug === localizeSlug(slug) ? "is-active" : ""}
              >
                {label}
              </Link>
            ))
          ) : (
            <span className="mk-side-coming">{lang === "zh" ? "整理中" : "Coming soon"}</span>
          )}
        </div>
      ))}
    </aside>
  );
}
