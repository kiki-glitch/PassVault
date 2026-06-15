"use client";

import { UserProfile } from "@clerk/nextjs";

export function AccountSecurityPanel() {
  return (
    <section className="rounded-vault-panel border border-vault-border bg-vault-card p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-support/70">
          Account Security
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Login, MFA & passkeys
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-vault-text-muted">
          Clerk manages account login security, including authentication
          methods, sessions, and profile details. Your vault master password is
          separate and is never sent to Clerk or Supabase.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-vault-card border border-emerald-300/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-100">
            Account login
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-100/75">
            Used to access the app. This is handled by Clerk and can support
            MFA, passkeys, email/password, and active session management.
          </p>
        </div>

        <div className="rounded-vault-card border border-pink-300/20 bg-pink-500/10 p-4">
          <p className="text-sm font-semibold text-pink-100">
            Vault master password
          </p>
          <p className="mt-2 text-sm leading-6 text-pink-100/75">
            Used only in your browser to decrypt saved passwords and notes. It
            cannot be recovered if forgotten.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-vault-card border border-vault-border bg-vault-inset p-4">
        <UserProfile routing="hash" />
      </div>
    </section>
  );
}
