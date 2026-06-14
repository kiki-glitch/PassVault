"use client";

import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { bMemoryVaultTheme } from "@/config/themes";
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

export function DashboardShell({
  passwordsSection,
  notesSection,
  generatorSection,
  securitySection,
  settingsSection,
}: DashboardShellProps) {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("passwords");

  return (
    <main className="min-h-screen bg-[#090812] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6 lg:py-6">
        <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-pink-500/5 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-pink-300/30 bg-white/10 text-2xl font-bold text-pink-300 shadow-lg shadow-pink-500/20">
              {bMemoryVaultTheme.ownerInitial}
            </div>

            <div>
              <p className="text-sm text-slate-400">Private vault</p>
              <h1 className="text-lg font-bold">{bMemoryVaultTheme.appName}</h1>
            </div>
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? "border border-pink-300/30 bg-pink-400/15 shadow-lg shadow-pink-500/10"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      isActive ? "text-pink-200" : "text-slate-200"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4">
            <p className="text-sm font-semibold text-blue-200">
              Zero-knowledge vault
            </p>
            <p className="mt-2 text-xs leading-5 text-blue-100/70">
              Passwords and notes are decrypted only in this browser after vault
              unlock.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="mb-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-blue-500/5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-pink-300">{bMemoryVaultTheme.copy.dashboardEyebrow}</p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                  {bMemoryVaultTheme.copy.dashboardGreeting}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {bMemoryVaultTheme.copy.dashboardSubtitle}
                </p>
              </div>

              <UserButton />
            </div>
          </header>

          {activeSection === "passwords" && passwordsSection}

          {activeSection === "notes" && notesSection}

          {activeSection === "generator" && generatorSection}

          {activeSection === "security" && securitySection}

          {/* {activeSection === "settings" && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-blue-300">Settings</p>
              <h2 className="mt-2 text-2xl font-bold">Vault settings</h2>
              <p className="mt-2 text-sm text-slate-400">
                Settings will come in the next phases: auto-lock, theme options,
                account security, and vault backup.
              </p>
            </div>
          )} */}

            {activeSection === "settings" && settingsSection}

        </section>
      </div>
    </main>
  );
}