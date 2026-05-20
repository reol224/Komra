"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Set this to true to enable pre-launch mode (only waitlist accessible)
const PRE_LAUNCH_MODE = false;

// Pages that are always accessible even in pre-launch mode
const ALLOWED_PAGES = [
  "/waitlist",
  "/privacy",
  "/terms",
  "/security",
  "/compliance",
  "/cookies",
  "/status",
  "/support",
];

export function LaunchModeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (PRE_LAUNCH_MODE) {
      // Check if current page is allowed
      const isAllowed = ALLOWED_PAGES.some((page) => pathname.startsWith(page));

      if (!isAllowed) {
        router.replace("/waitlist");
      }
    }
  }, [pathname, router]);

  // In pre-launch mode, don't render restricted pages
  if (PRE_LAUNCH_MODE) {
    const isAllowed = ALLOWED_PAGES.some((page) => pathname.startsWith(page));
    if (!isAllowed) {
      return null;
    }
  }

  return <>{children}</>;
}
