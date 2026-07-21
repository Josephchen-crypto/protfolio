import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionFromCookies, requireAdmin } from "@/lib/auth/session";
import { getDict } from "@/i18n";
import type { Language } from "@/i18n/config";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Admin section layout.
 *
 * Server-side authoritative gate: verifies the JWT cookie, loads the backing
 * user, and rejects anyone who is not an admin. The middleware does an
 * earlier pass so unauthenticated users don't even hit this render, but that
 * one is defence-in-depth only — this layout is the source of truth.
 *
 * - No session → redirect to `/[lang]/login?next=/[lang]/admin`
 * - Session but not admin → 403-style page
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Language;
  const dict = await getDict(lang);
  const session = await getSessionFromCookies();

  if (!session) {
    const nextParam = encodeURIComponent(`/${lang}/admin`);
    redirect(`/${lang}/login?next=${nextParam}`);
  }

  if (!requireAdmin(session)) {
    return (
      <main className="min-h-screen bg-background pt-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-heading font-bold text-white mb-4">
            {dict.admin.unauthorized}
          </h1>
          <p className="text-slate-400">
            {dict.admin.unauthorizedMessage}
          </p>
        </div>
      </main>
    );
  }

  const displayName = session.user.display_name ?? session.payload.username;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav
        lang={lang}
        dict={dict}
        displayName={displayName}
        avatarUrl={session.user.avatar_url}
      />
      <main className="pt-24 px-6 pb-16">{children}</main>
    </div>
  );
}

// The gate must run per-request — never statically cached.
export const dynamic = "force-dynamic";
