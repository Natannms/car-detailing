import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { SideMenu } from "@/components/navigation/SideMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillingGateOverlay } from "./BillingGateOverlay";
import { SessionRefresh } from "./SessionRefresh";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-muted/30">
      <SessionRefresh />
      <BillingGateOverlay />
      <div className="flex w-full gap-6 px-4 py-4 lg:px-6 lg:py-6">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="min-h-[calc(100vh-56px)] rounded-xl bg-card ring-1 ring-border">
            <SideMenu />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MagnifyingGlass size={18} weight="bold" />
              </div>
              <input
                placeholder="Search"
                className="h-11 w-full rounded-2xl border border-border bg-card pl-10 pr-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />
              <div className="hidden items-center gap-2 rounded-2xl bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm ring-1 ring-border md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </header>

          <main className="min-w-0 pb-6 lg:pb-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
