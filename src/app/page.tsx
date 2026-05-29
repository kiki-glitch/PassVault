import { bMemoryVaultTheme } from "@/config/themes";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#090812] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-pink-300/30 bg-white/10 text-4xl font-bold text-pink-300 shadow-lg shadow-pink-500/20">
          {bMemoryVaultTheme.ownerInitial}
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
          {bMemoryVaultTheme.copy.landingTitle}
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          {bMemoryVaultTheme.copy.landingSubtitle}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/dashboard"
            className="rounded-full bg-pink-400 px-8 py-3 font-semibold text-slate-950 transition hover:bg-pink-300"
          >
            Enter Vault
          </a>

          <a
            href="/dashboard"
            className="rounded-full border border-blue-300/40 px-8 py-3 font-semibold text-blue-200 transition hover:bg-blue-300/10"
          >
            View Demo
          </a>
        </div>
      </section>
    </main>
  );
}