import { UserButton } from "@clerk/nextjs";
import { bMemoryVaultTheme } from "@/config/themes";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#090812] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-pink-300">B’s private vault</p>
            <h1 className="mt-2 text-3xl font-bold">
              {bMemoryVaultTheme.copy.dashboardGreeting}
            </h1>
          </div>

          <UserButton/>
        </header>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.values(bMemoryVaultTheme.labels).map((label) => (
            <div
              key={label}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-pink-500/5"
            >
              <h2 className="text-lg font-semibold">{label}</h2>
              <p className="mt-3 text-sm text-slate-400">Coming soon.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}