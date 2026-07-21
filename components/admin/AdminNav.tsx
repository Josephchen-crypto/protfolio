"use client";

import { useRouter } from "next/navigation";
import type { Dict } from "@/i18n";
import type { Language } from "@/i18n/config";

interface AdminNavProps {
  lang: Language;
  dict: Dict;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Sticky top navigation for the admin section.
 *
 * Client component because the sign-out button posts to the logout endpoint
 * and then refreshes the router — no useEffect / no data fetching here, all
 * user data is passed in as props from the server-authenticated layout.
 */
export function AdminNav({ lang, dict, displayName, avatarUrl }: AdminNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch(`/api/auth/logout?lang=${lang}`, { method: "POST" });
    router.refresh();
    router.push(`/${lang}`);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a
            href={`/${lang}`}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← {dict.admin.backToSite}
          </a>
          <span className="text-white font-heading font-semibold">
            {dict.admin.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">
            {dict.admin.signedInAs}
          </span>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-white hidden sm:inline">
            {displayName}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-white transition-colors ml-2"
          >
            {dict.auth?.signOut ?? "Sign out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
