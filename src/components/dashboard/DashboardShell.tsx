"use client";

import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { bMemoryVaultTheme } from "@/config/themes";
import { useVault } from "@/components/vault/VaultProvider";
import { VaultUnlockCard } from "@/components/vault/VaultUnlockCard";
import type { DashboardSection } from "@/types/navigation";

type DashboardShellProps = {
  passwordsSection: ReactNode;
  notesSection: ReactNode;
  generatorSection: ReactNode;
  securitySection: ReactNode;
  settingsSection: ReactNode;
};

const navItems: {
  id: DashboardSection;
  label: string;
  description: string;
}[] = [
  {
    id: "passwords",
    label: bMemoryVaultTheme.labels.passwords,
    description: bMemoryVaultTheme.labels.passwordsDescription,
  },
  {
    id: "notes",
    label: bMemoryVaultTheme.labels.notes,
    description: bMemoryVaultTheme.labels.notesDescription,
  },
  {
    id: "generator",
    label: bMemoryVaultTheme.labels.generator,
    description: bMemoryVaultTheme.labels.generatorDescription,
  },
  {
    id: "security",
    label: bMemoryVaultTheme.labels.security,
    description: bMemoryVaultTheme.labels.securityDescription,
  },
  {
    id: "settings",
    label: bMemoryVaultTheme.labels.settings,
    description: bMemoryVaultTheme.labels.settingsDescription,
  },
];

// Shared class strings — mirrors VaultUnlockCard's pattern
const panelCls =
  "rounded-vault-panel border border-vault-border bg-vault-card shadow-2xl shadow-black/40";

const navItemBaseCls =
  "w-full rounded-vault-chip px-3 py-2.5 text-left transition";

const navItemActiveCls = "border border-vault-accent/20 bg-vault-accent/[0.08]";

const navItemInactiveCls =
  "border border-transparent hover:bg-vault-overlay/[0.04]";

export function DashboardShell({
  passwordsSection,
  notesSection,
  generatorSection,
  securitySection,
  settingsSection,
}: DashboardShellProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("passwords");
  const { isUnlocked } = useVault();

  return (
    <main className="min-h-screen bg-vault-bg text-vault-text">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-6">

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside
          className={`flex flex-col p-5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] ${panelCls}`}
        >
          {/* Persistent identity: monogram + app name */}
          <div className="flex items-center gap-3 border-b border-vault-border pb-5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-vault-chip bg-vault-accent/10 font-display text-sm font-medium text-vault-accent">
              {bMemoryVaultTheme.ownerInitial}
            </div>
            <p className="font-display text-sm font-medium text-vault-text/70">
              {bMemoryVaultTheme.appName}
            </p>
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`${navItemBaseCls} ${
                    isActive ? navItemActiveCls : navItemInactiveCls
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-vault-accent" : "text-vault-text-muted"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-vault-text-faint">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </nav>

          {/* ZK callout — pinned to bottom */}
          <div className="mt-auto border-t border-vault-border pt-5">
            <div className="rounded-vault-chip border border-vault-support/15 bg-vault-support/[0.06] px-4 py-3">
              <p className="text-xs font-medium text-vault-support">
                Zero-knowledge vault
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-vault-support/55">
                Passwords and notes are decrypted only in this browser after
                vault unlock.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <section className="min-w-0">
          {!isUnlocked ? (
            <VaultUnlockCard />
          ) : (
            <>
              {/* Dashboard greeting header */}
              <header className={`mb-6 p-5 ${panelCls}`}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
                      {bMemoryVaultTheme.copy.dashboardEyebrow}
                    </p>
                    <h2 className="mt-2 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
                      {bMemoryVaultTheme.copy.dashboardGreeting}
                    </h2>
                    <p className="mt-2 text-sm text-vault-text-muted">
                      {bMemoryVaultTheme.copy.dashboardSubtitle}
                    </p>
                  </div>

                  <UserButton />
                </div>
              </header>

              <VaultUnlockCard />

              {activeSection === "passwords" && passwordsSection}
              {activeSection === "notes" && notesSection}
              {activeSection === "generator" && generatorSection}
              {activeSection === "security" && securitySection}
              {activeSection === "settings" && settingsSection}
            </>
          )}
        </section>

      </div>
    </main>
  );
}
