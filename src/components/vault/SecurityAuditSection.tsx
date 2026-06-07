"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { auditPasswords } from "@/lib/security/passwordAudit";
import { getVaultItems } from "@/lib/supabase/vaultItems";
import { getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem, PasswordAuditResult } from "@/types/vault";

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
  if (severity === "high") {
    return "border-red-300/20 bg-red-500/10 text-red-100";
  }

  if (severity === "medium") {
    return "border-orange-300/20 bg-orange-500/10 text-orange-100";
  }

  return "border-blue-300/20 bg-blue-500/10 text-blue-100";
}

export function SecurityAuditSection(){
    const {user, isLoaded} = useUser();
    const {getToken} = useAuth();
    const {isUnlocked, vaultKey} = useVault();

    const [items, setItems] = useState<DecryptedVaultItem[]>([]);
    const [message, setMessage] = useState("Unlock the vault to run safety check.");
    const [isLoading, setIsLoading] = useState(false);

    const auditResult: PasswordAuditResult | null = useMemo(() => {
        if (!isUnlocked || items.length === 0) {
            return null;
        }

        return auditPasswords(items);
    },[isUnlocked,items]);      

    async function loadItemsForAudit() {
        if(!isLoaded || !user) return;

        if(!isUnlocked || !vaultKey){
            setItems([]);
            setMessage("Unlock the vault to run safety check.");
            return;
        }

        try{
            setIsLoading(true);
            setMessage("Decrypting saved keys locally for safety check...");

            const vaults = await getVaults(getToken);

            if(vaults.length === 0){
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
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
                <p className="text-sm text-pink-300">Safety Check</p>
                <h2 className="mt-2 text-2xl font-bold">Security audit</h2>
                <p className="mt-2 text-sm text-slate-400">{message}</p>
            </div>

            {!isUnlocked && (
                <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
                    <p className="text-sm text-yellow-100">
                        Unlock your vault to analyze saved passwords locally.
                    </p>
                </div>
            )}

            {isUnlocked && isLoading && (
                <div className="mt-6 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4">
                    <p className="text-sm text-blue-100">Running local audit...</p>
                </div>
            )}

            {isUnlocked && auditResult && (
                <div className="mt-6 grid gap-6">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-slate-400">Vault security score</p>
                        <h3 className="mt-1 text-4xl font-bold text-white">
                            {auditResult.score}/100
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                            {getScoreLabel(auditResult.score)}
                        </p>
                    </div>

                    <div className="w-full sm:w-64">
                        <div className="h-3 overflow-hidden rounded-full bg-slate-700/70">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${getScoreBarClass(
                            auditResult.score
                            )}`}
                        />
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-sm text-slate-400">Saved keys</p>
                        <p className="mt-2 text-2xl font-bold">{auditResult.totalItems}</p>
                    </div>

                    <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
                        <p className="text-sm text-red-100">Weak</p>
                        <p className="mt-2 text-2xl font-bold">{auditResult.weakCount}</p>
                    </div>

                    <div className="rounded-2xl border border-orange-300/20 bg-orange-500/10 p-4">
                        <p className="text-sm text-orange-100">Short</p>
                        <p className="mt-2 text-2xl font-bold">{auditResult.shortCount}</p>
                    </div>

                    <div className="rounded-2xl border border-pink-300/20 bg-pink-500/10 p-4">
                        <p className="text-sm text-pink-100">Reused</p>
                        <p className="mt-2 text-2xl font-bold">
                        {auditResult.reusedCount}
                    </p>
                    </div>

                    <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4">
                        <p className="text-sm text-blue-100">Missing URLs</p>
                        <p className="mt-2 text-2xl font-bold">
                            {auditResult.missingUrlCount}
                        </p>
                    </div>
                </div>

                {auditResult.issues.length > 0 ? (
                    <div className="grid gap-3">
                        <h3 className="text-lg font-semibold text-white">
                            Issues found
                        </h3>

                        {auditResult.issues.map((issue, index) => (
                            <div
                            key={`${issue.itemId}-${issue.type}-${index}`}
                            className={`rounded-2xl border p-4 ${getSeverityClass(
                                issue.severity
                            )}`}
                            >
                            <p className="text-sm font-semibold">{issue.title}</p>
                            <p className="mt-1 text-sm opacity-80">{issue.message}</p>
                            </div>
                        ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                        <p className="text-sm font-semibold text-emerald-100">
                            No issues found.
                        </p>
                        <p className="mt-1 text-sm text-emerald-100/80">
                            Your saved passwords look strong based on local checks.
                        </p>
                        </div>
                    )}
                    </div>
                )}
        </section>
  );

}