import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090812] px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-pink-300/30 bg-white/10 text-3xl font-bold text-pink-300 shadow-lg shadow-pink-500/20">
            B
          </div>

          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to continue to B’s Memory Vault.
          </p>
        </div>

        <SignIn />
      </div>
    </main>
  );
}