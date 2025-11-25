"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", mobileLabel: "Home" },
  { href: "/logs", label: "Logs", mobileLabel: "Logs" },
  { href: "/chat", label: "Chat", mobileLabel: "Chat" }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
      {links.map(link => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "transition-colors hover:text-primary px-1.5 py-1 sm:px-0 sm:py-0 rounded",
              isActive ? "text-primary bg-primary/10 sm:bg-transparent" : "text-muted-foreground"
            )}
          >
            <span className="sm:hidden">{link.mobileLabel}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
