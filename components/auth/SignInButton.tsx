"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ProviderId } from "@/lib/auth/providers/types";
import type { ButtonProps } from "@/components/ui/Button";

interface SignInButtonProps extends Omit<ButtonProps, "onClick"> {
  providerId: ProviderId;
  providerName: string;
  lang: "en" | "zh";
}

/**
 * Button that redirects to the OAuth authorize endpoint for the given provider.
 * Client component because it uses useRouter from next/navigation.
 */
export function SignInButton({
  providerId,
  providerName,
  lang,
  children,
  variant = "primary",
  ...props
}: SignInButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/api/auth/${providerId}?provider=${providerId}&lang=${lang}`);
  };

  return (
    <Button onClick={handleClick} variant={variant} {...props}>
      {children ?? providerName}
    </Button>
  );
}
