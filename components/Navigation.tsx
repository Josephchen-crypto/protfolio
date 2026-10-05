"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  BookMarked,
  Boxes,
  Home,
  Menu,
  Route,
  Search,
  UserRound,
  Wrench,
  X,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { UserMenu } from "./auth/UserMenu";
import { type Language } from "@/i18n/config";
import { type Dict } from "@/i18n";

export function Navigation({
  lang,
  dict,
  pairedSlug,
}: {
  lang: Language;
  dict: Dict;
  pairedSlug?: string | null;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isZh = lang === "zh";
  const navItems = [
    { key: "home", label: isZh ? "首页" : "Home", href: `/${lang}`, icon: Home },
    { key: "knowledge", label: isZh ? "知识库" : "Knowledge", href: `/${lang}/knowledge`, icon: BookOpenText },
    { key: "path", label: isZh ? "学习路径" : "Learning Path", href: `/${lang}/learning-path`, icon: Route },
    { key: "notes", label: isZh ? "笔记" : "Notes", href: `/${lang}/blog`, icon: BookMarked },
    { key: "tools", label: isZh ? "工具箱" : "Toolbox", href: `/${lang}/toolbox`, icon: Wrench },
    { key: "resources", label: isZh ? "资源" : "Resources", href: `/${lang}/resources`, icon: Boxes },
    { key: "about", label: isZh ? "关于" : "About", href: `/${lang}/about`, icon: UserRound },
  ] as const;

  const activeKey =
    pathname.includes("/knowledge")
      ? "knowledge"
      : pathname.includes("/blog")
        ? "notes"
        : pathname.includes("/learning-path")
          ? "path"
          : pathname.includes("/toolbox")
            ? "tools"
            : pathname.includes("/resources")
              ? "resources"
              : pathname.includes("/about")
                ? "about"
                : pathname === `/${lang}`
                  ? "home"
                  : "";

  return (
    <nav className="mk-nav">
      <div className="mk-nav-inner">
        <a href={`/${lang}`} className="mk-brand" aria-label="MyKnowledge home">
          <span className="mk-brand-mark"><img src="/myknowledge/brand-logo.svg" alt="" /></span>
          <span className="mk-brand-copy">
            <b>MyKnowledge <em>v1.0</em></b>
            <small>{isZh ? "技术人的终身学习库" : "Personal Tech Learning OS"}</small>
          </span>
        </a>

        <div className="mk-nav-links">
          {navItems.map(({ key, label, href, icon: Icon }) => (
            <a key={key} href={href} className={activeKey === key ? "is-active" : ""}>
              <Icon size={14} />
              <span>{label}</span>
            </a>
          ))}
        </div>

        <div className="mk-nav-actions">
          <a className="mk-search-link" href={`/${lang}/search`}>
            <Search size={14} />
            <span>{isZh ? "搜索知识、笔记、概念..." : "Search knowledge..."}</span>
            <kbd>⌘K</kbd>
          </a>
          <LanguageToggle currentLang={lang} pairedSlug={pairedSlug} />
          <UserMenu lang={lang} dict={dict} />
          <button
            className="mk-mobile-menu"
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            type="button"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="mk-mobile-nav">
          {navItems.map(({ key, label, href, icon: Icon }) => (
            <a
              key={key}
              href={href}
              className={activeKey === key ? "is-active" : ""}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon size={15} />
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
