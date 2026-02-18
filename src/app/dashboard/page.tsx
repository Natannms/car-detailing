import { DotsThree, Plus, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Launch Kanban dashboard theme</h1>
          <p className="mt-1 text-sm text-gray-600">Visualize o progresso do seu trabalho em um layout organizado por prioridades.</p>

          <div className="mt-4 flex items-center gap-1">
            <button className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-black/5">
              View all
            </button>
            <button className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white/70">
              Most recent
            </button>
            <button className="rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white/70">
              Popular
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl bg-white shadow-sm">
            <ShareNetwork weight="bold" />
            Share
          </Button>
          <Button className="rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700">
            <Plus weight="bold" />
            Create
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">New tasks</div>
            <button className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <DotsThree weight="bold" />
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Get another day full of work done!</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[74%] rounded-full bg-indigo-600" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">74%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Keep my mentality healthy</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[38%] rounded-full bg-emerald-500" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">38%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Do today</div>
            <button className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <DotsThree weight="bold" />
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Figure out how to use the help center</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[10%] rounded-full bg-indigo-600" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">10%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Build some new components in Figma</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[83%] rounded-full bg-emerald-500" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">83%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">In progress</div>
            <button className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <DotsThree weight="bold" />
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Build some new components in Figma</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[83%] rounded-full bg-indigo-600" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">83%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Create wireframes for the new dashboard</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[4%] rounded-full bg-amber-500" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">4%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">For later</div>
            <button className="rounded-lg p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700">
              <DotsThree weight="bold" />
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Figure out how to use the help center</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[10%] rounded-full bg-gray-400" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">10%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Create wireframes for the new dashboard</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[4%] rounded-full bg-gray-400" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span className="font-medium text-gray-700">4%</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
