import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { SideMenu } from "@/components/navigation/SideMenu";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#EEF1F6]">
      <div className="mx-auto flex max-w-[1400px] gap-6 px-0 py-0 lg:px-4 lg:py-6">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="min-h-[calc(100vh-56px)] bg-[#F7F8FB] ring-1 ring-black/5">
            <SideMenu />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <MagnifyingGlass size={18} weight="bold" />
              </div>
              <input
                placeholder="Search"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-black/5 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </div>
            </div>
          </header>

          <main className="min-w-0 px-4 pb-6 lg:px-0 lg:pb-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
