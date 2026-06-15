"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { auditPasswords } from "@/lib/security/passwordAudit";
import { getVaultItems } from "@/lib/supabase/vaultItems";
import { getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem, PasswordAuditResult } from "@/types/vault";
import { bMemoryVaultTheme } from "@/config/themes";

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "High risk";
}

function getScoreBarClass(score: number) {
  if (score >= 85) return "bg-emerald-400 w-full";
  if (score >= 70) return "bg-blue-400 w-4/5";
  if (score >= 50) return "bg-orange-400 w-3/5";
  return "bg-red-400 w-1/3";
}

function getSeverityClass(severity: "low" | "medium" | "high") {
  if (severity === "high")   return "border-red-400/20 bg-red-500/10 text-red-100";
  if (severity === "medium") return "border-orange-400/20 bg-orange-500/10 text-orange-100";
  return "border-blue-400/20 bg-blue-500/10 text-blue-100";
}

export function SecurityAuditSection() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey } = useVault();

  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [message, setMessage] = useState("Unlock the vault to run safety check.");
  const [isLoading, setIsLoading] = useState(false);

  const auditResult: PasswordAuditResult | null = useMemo(() => {
    if (!isUnlocked || items.length === 0) {
      return null;
    }

    return auditPasswords(items);
  }, [isUnlocked, items]);

  async function loadItemsForAudit() {
    if (!isLoaded || !user) return;

    if (!isUnlocked || !vaultKey) {
      setItems([]);
      setMessage("Unlock the vault to run safety check.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("Decrypting saved keys locally for safety check...");

      const vaults = await getVaults(getToken);

      if (vaults.length === 0) {
        setItems([]);
        setMessage("No vault found yet. Add passwords before running safety check.");
        return;
      }

      const encryptedRows = await getVaultItems({
        getToken,
        vaultId: vaults[0].id,
      });

      const decryptedItems = await Promise.all(
        encryptedRows.map((row) =>
          decryptVaultItem({
            row,
            key: vaultKey,
          })
        )
      );

      setItems(decryptedItems);
      setMessage("Safety check completed locally in your browser.");
    } catch (error) {
      console.error("Security audit failed:", error);
      setItems([]);
      setMessage("Could not run safety check. Check console.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItemsForAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isUnlocked, vaultKey]);

  return (
    <section className="mt-6 rounded-vault-panel border border-white/8 bg-vault-card p-6">

      {/* Section header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          {bMemoryVaultTheme.labels.security}
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Safety check
        </h2>
        <p className="mt-1.5 text-sm text-vault-text-muted">{message}</p>
      </div>

      {/* Locked notice */}
      {!isUnlocked && (
        <div className="mt-5 rounded-vault-chip border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-vault-text-muted">
            Unlock your vault to analyze saved passwords locally.
          </p>
        </div>
      )}

      {/* Loading */}
      {isUnlocked && isLoading && (
        <div className="mt-5 rounded-vault-chip border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-vault-text-muted">Running local safety check...</p>
        </div>
      )}

      {isUnlocked && auditResult && (
        <div className="mt-6 grid gap-5">

          {/* Score card */}
          <div className="rounded-vault-card border border-white/8 bg-black/30 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-vault-text-faint">Vault security score</p>
                <p className="mt-1 font-display text-4xl font-medium text-vault-text">
                  {auditResult.score}
                  <span className="ml-0.5 text-xl text-vault-text-faint">/100</span>
                </p>
                <p className={`mt-1 text-sm font-medium ${
                  auditResult.score >= 85 ? "text-emerald-400" :
                  auditResult.score >= 70 ? "text-blue-400"   :
                  auditResult.score >= 50 ? "text-orange-400" : "text-red-400"
                }`}>
                  {getScoreLabel(auditResult.score)}
                </p>
              </div>
              <div className="w-full sm:w-64">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBarClass(auditResult.score)}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-vault-card border border-white/8 bg-vault-card p-4">
              <p className="text-xs text-vault-text-faint">Saved keys</p>
              <p className="mt-2 font-display text-2xl font-medium text-vault-text">
                {auditResult.totalItems}
              </p>
            </div>
            <div className="rounded-vault-card border border-red-400/20 bg-red-500/10 p-4">
              <p className="text-xs text-red-200/70">Weak</p>
              <p className="mt-2 font-display text-2xl font-medium text-red-100">
                {auditResult.weakCount}
              </p>
            </div>
            <div className="rounded-vault-card border border-orange-400/20 bg-orange-500/10 p-4">
              <p className="text-xs text-orange-200/70">Short</p>
              <p className="mt-2 font-display text-2xl font-medium text-orange-100">
                {auditResult.shortCount}
              </p>
            </div>
            <div className="rounded-vault-card border border-amber-400/20 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-200/70">Reused</p>
              <p className="mt-2 font-display text-2xl font-medium text-amber-100">
                {auditResult.reusedCount}
              </p>
            </div>
            <div className="rounded-vault-card border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-xs text-blue-200/70">No URL</p>
              <p className="mt-2 font-display text-2xl font-medium text-blue-100">
                {auditResult.missingUrlCount}
              </p>
            </div>
          </div>

          {/* Issues */}
          {auditResult.issues.length > 0 ? (
            <div className="grid gap-3">
              <h3 className="font-display text-base font-medium text-vault-text">
                Issues found
              </h3>
              {auditResult.issues.map((issue, index) => (
                <div
                  key={`${issue.itemId}-${issue.type}-${index}`}
                  className={`rounded-vault-card border p-4 ${getSeverityClass(issue.severity)}`}
                >
                  <p className="text-sm font-medium">{issue.title}</p>
                  <p className="mt-1 text-sm opacity-75">{issue.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-vault-card border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-sm font-medium text-emerald-100">No issues found.</p>
              <p className="mt-1 text-sm text-emerald-100/75">
                Your saved passwords look strong based on local checks.
              </p>
            </div>
          )}

        </div>
      )}

    </section>
  );
}
