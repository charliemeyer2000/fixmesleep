import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { LogoutButton } from "@/components/logout-button";

export function SiteHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="border-b bg-background flex-shrink-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="font-semibold tracking-tight text-sm sm:text-base whitespace-nowrap">
            fixmysleep · data
          </Link>
          <MainNav />
        </div>
        <div className="flex items-center gap-2">
          <LogoutButton />
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
