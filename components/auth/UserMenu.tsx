"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { Dict } from "@/i18n";
import type { Language } from "@/i18n/config";

export interface CurrentUser {
  userId: number;
  username: string;
  role: "admin" | "user";
  provider: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface UserMenuProps {
  lang: Language;
  dict: Dict;
}

/**
 * User menu displayed in the navigation bar.
 * - If not logged in: shows a "Sign In" link to the login page
 * - If logged in: shows the user avatar (or username) in a dropdown with a sign out button
 */
export function UserMenu({ lang, dict }: UserMenuProps) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json() as unknown as CurrentUser;
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  const handleSignOut = async () => {
    await fetch(`/api/auth/logout?lang=${lang}`, { method: "POST" });
    setUser(null);
    setOpen(false);
    router.refresh();
    router.push(`/${lang}`);
  };

  if (loading) {
    return <div className="mk-user-skeleton" />;
  }

  if (!user) {
    return (
      <a
        href={`/${lang}/login`}
        className="mk-signin-link"
      >
        {dict.auth?.signIn ?? "Sign In"}
      </a>
    );
  }

  const displayName = user.displayName || user.username;
  const avatarUrl = user.avatarUrl;

  return (
    <div className="mk-user-menu">
      <button
        onClick={() => setOpen(!open)}
        className="mk-user-button"
        aria-label="Open user menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="mk-user-avatar"
          />
        ) : (
          <div className="mk-user-avatar mk-user-fallback">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className={clsx(
              "mk-user-dropdown",
            )}
          >
            <div className="mk-user-dropdown-head">
              <p className="font-medium text-white">{displayName}</p>
              {user.role === "admin" && (
                <p className="text-xs text-neon-purple">Admin</p>
              )}
            </div>
            {user.role === "admin" && (
              <a
                href={`/${lang}/admin`}
                className="mk-user-dropdown-link"
                onClick={() => setOpen(false)}
              >
                {dict.auth?.dashboard ?? "Dashboard"}
              </a>
            )}
            <button
              onClick={handleSignOut}
              className="mk-user-dropdown-link mk-user-dropdown-button"
            >
              {dict.auth?.signOut ?? "Sign Out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
