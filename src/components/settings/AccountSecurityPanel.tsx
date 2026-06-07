"use client";

import { UserProfile } from "@clerk/nextjs";

export function AccountSecurityPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div>
        <p className="text-sm text-blue-300">Account Security</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Login, MFA & passkeys
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Clerk manages account login security, including authentication
          methods, sessions, and profile details. Your vault master password is
          separate and is never sent to Clerk or Supabase.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-100">
            Account login
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-100/75">
            Used to access the app. This is handled by Clerk and can support
            MFA, passkeys, email/password, and active session management.
          </p>
        </div>

        <div className="rounded-2xl border border-pink-300/20 bg-pink-500/10 p-4">
          <p className="text-sm font-semibold text-pink-100">
            Vault master password
          </p>
          <p className="mt-2 text-sm leading-6 text-pink-100/75">
            Used only in your browser to decrypt saved passwords and notes. It
            cannot be recovered if forgotten.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-4">
        <UserProfile />
      </div>
    </section>
  );
}