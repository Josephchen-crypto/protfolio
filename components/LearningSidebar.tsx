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
import { jvmMilestones } from "@/lib/learning-progress";

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
        items: jvmMilestones.map((item) => ({
          slug: item.slug,
          label: item.label,
          status: item.status,
        })),
      },
      {
        id: "android",
        title: "Android",
        icon: Smartphone,
        items: [
          { slug: "android-development-tips", label: "01 · Android engineering", status: "completed" as const },
          { slug: "yak-android-error-handling-architecture", label: "02 · Error architecture", status: "completed" as const },
          { slug: "yak-android-payment-architecture-deep-dive", label: "03 · Payment architecture", status: "completed" as const },
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

  const activeGroupId = (() => {
    if (!currentSlug) return "jvm";

    for (const group of groups) {
      const found = group.items.some(
        (item) => item.slug && currentSlug === localizeSlug(item.slug)
      );
      if (found) return group.id;
    }

    return "jvm";
  })();

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
          (item) => item.slug && currentSlug === localizeSlug(item.slug)
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
                (isOpen && hasItems) || !hasItems ? "is-open" : "",
                !hasItems ? "is-empty" : "",
              ].join(" ")}
            >
              {hasItems ? (
                items.map((item) =>
                  item.slug ? (
                    <Link
                      key={item.label}
                      href={`/${lang}/blog/${localizeSlug(item.slug)}`}
                      className={
                        currentSlug === localizeSlug(item.slug) ? "is-active" : ""
                      }
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={item.label}
                      className={item.status === "current" ? "mk-side-current-text" : "mk-side-unlinked"}
                    >
                      {item.label}
                    </span>
                  )
                )
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
