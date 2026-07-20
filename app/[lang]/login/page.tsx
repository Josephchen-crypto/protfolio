import { Card } from "@/components/ui/Card";
import { getDict } from "@/i18n";
import { listEnabledProviders } from "@/lib/auth/providers";
import { SignInButton } from "@/components/auth/SignInButton";
import type { Language } from "@/i18n/config";

interface LoginPageProps {
  params: Promise<{
    lang: Language;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;
  const dict = await getDict(lang);
  const providers = listEnabledProviders();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 pt-20">
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-heading font-bold text-white mb-2">
            {dict.auth.loginTitle}
          </h1>
          <p className="text-slate-400 mb-6">
            {dict.auth.signIn}
          </p>

          <div className="flex flex-col gap-3">
            {providers.map((provider) => (
              <SignInButton
                key={provider.id}
                providerId={provider.id}
                providerName={provider.displayName}
                lang={lang}
                size="lg"
                className="w-full justify-center"
              >
                {dict.auth.signInWith.replace("{provider}", provider.displayName)}
              </SignInButton>
            ))}
          </div>

          {providers.length === 0 && (
            <p className="text-yellow-400 text-sm mt-4">
              No login providers are configured. Please set environment variables.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

// Dynamic because we list enabled providers from env at request time
export const dynamic = "force-dynamic";
