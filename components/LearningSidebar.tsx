"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Network,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { Language } from "@/i18n/config";

const STORAGE_KEY = "myknowledge-learning-sidebar-v1";

export function LearningSidebar({
  lang,
  currentSlug,
}: {
  lang: Language;
  currentSlug?: string;
}) {
  const localizeSlug = (base: string) => (lang === "zh" ? `${base}-zh` : base);

  const groups = useMemo(
    () => [
      {
        id: "jvm",
        title: "Java / JVM",
        icon: Cpu,
        items: [
          ["android-runtime-from-source-to-art", "01 · Runtime model"],
          ["jvm-runtime-data-areas", "02 · Runtime data areas"],
          ["java-object-creation-jvm", "03 · Object creation"],
          ["jvm-class-file-bytecode", "04 · ClassFile / Bytecode"],
          ["jvm-gc-memory", "05 · GC / Memory"],
          ["jmm-basics", "06 · JMM / happens-before"],
        ],
      },
      {
        id: "android",
        title: "Android",
        icon: Smartphone,
        items: [
          ["android-development-tips", "01 · Android engineering"],
          ["yak-android-error-handling-architecture", "02 · Error architecture"],
          ["yak-android-payment-architecture-deep-dive", "03 · Payment architecture"],
        ],
      },
      {
        id: "web3",
        title: "Web3 / Wallet",
        icon: Network,
        items: [],
      },
      {
        id: "security",
        title: "Security",
        icon: ShieldCheck,
        items: [],
      },
    ],
    []
  );

  const activeGroupId = useMemo(() => {
    if (!currentSlug) return "jvm";

    for (const group of groups) {
      const found = group.items.some(
        ([slug]) => currentSlug === localizeSlug(slug)
      );
      if (found) return group.id;
    }

    return "jvm";
  }, [currentSlug, groups, lang]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    jvm: true,
    android: false,
    web3: false,
    security: false,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};

      setOpenGroups((previous) => ({
        ...previous,
        ...parsed,
        [activeGroupId]: true,
      }));
    } catch {
      setOpenGroups((previous) => ({
        ...previous,
        [activeGroupId]: true,
      }));
    }
  }, [activeGroupId]);

  const toggleGroup = (id: string) => {
    setOpenGroups((previous) => {
      const next = {
        ...previous,
        [id]: !previous[id],
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Local storage is optional. The sidebar still works without it.
      }

      return next;
    });
  };

  return (
    <aside className="mk-article-sidebar">
      <div className="mk-article-sidebar-title">
        <span>◈</span>
        {lang === "zh" ? "学习路径" : "Learning Path"}
      </div>

      {groups.map(({ id, title, icon: Icon, items }) => {
        const isOpen = Boolean(openGroups[id]);
        const hasItems = items.length > 0;
        const hasActiveItem = items.some(
          ([slug]) => currentSlug === localizeSlug(slug)
        );

        return (
          <div
            className={[
              "mk-article-side-group",
              hasActiveItem ? "has-active-item" : "",
            ].join(" ")}
            key={id}
          >
            <button
              type="button"
              className="mk-article-side-heading"
              onClick={() => hasItems && toggleGroup(id)}
              aria-expanded={hasItems ? isOpen : undefined}
              disabled={!hasItems}
            >
              <span className="mk-side-heading-main">
                <Icon size={14} />
                <span>{title}</span>
              </span>

              <span className="mk-side-heading-meta">
                {hasItems && <small>{items.length}</small>}
                {hasItems ? (
                  isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : null}
              </span>
            </button>

            <div
              className={[
                "mk-side-items",
                isOpen && hasItems ? "is-open" : "",
              ].join(" ")}
            >
              {hasItems ? (
                items.map(([slug, label]) => (
                  <Link
                    key={slug}
                    href={`/${lang}/blog/${localizeSlug(slug)}`}
                    className={
                      currentSlug === localizeSlug(slug) ? "is-active" : ""
                    }
                  >
                    {label}
                  </Link>
                ))
              ) : (
                <span className="mk-side-coming">
                  {lang === "zh" ? "整理中" : "Coming soon"}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
