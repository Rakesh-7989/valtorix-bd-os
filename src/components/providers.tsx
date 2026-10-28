"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type ProvidersProps = {
  children: React.ReactNode;
  session?: Session | null;
};

export function Providers({ children, session }: ProvidersProps) {
  // During SSR (window undefined), render without SessionProvider
  // to avoid Date.now() being evaluated at prerender time.
  // On the client, SessionProvider mounts normally.
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
