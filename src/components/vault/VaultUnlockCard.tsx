"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useVault } from "./VaultProvider";
import { bMemoryVaultTheme } from "@/config/themes";
import {
  completeVaultSetup,
  ensureUserProfile,
  type ProfileRow,
} from "@/lib/supabase/profile";
import { arrayBuffertoBase64, generateSalt } from "@/lib/crypto/vaultCrypto";

type VaultMode = "loading" | "setup" | "unlock";

// Shared class strings — every token comes from the theme system
const inputCls =
  "w-full rounded-vault-input border border-vault-border bg-vault-inset px-4 py-3 text-sm " +
  "text-vault-text placeholder:text-vault-text-faint outline-none transition focus:border-vault-accent/50";

const primaryBtnCls =
  "mt-1 w-full rounded-vault-input bg-vault-accent py-3 text-sm font-semibold " +
  "text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const cardShellCls = "flex min-h-[56vh] items-center justify-center px-4 py-12";
const cardInnerCls =
  "w-full max-w-[360px] rounded-vault-card border border-vault-border bg-vault-card " +
  "p-8 shadow-2xl shadow-black/50 ring-1 ring-vault-accent/10";

export function VaultUnlockCard() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const {
    isUnlocked,
    unlockVault,
    lockVault,
    lastActivityAt,
    autoLockDurationMs,
  } = useVault();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [mode, setMode] = useState<VaultMode>("loading");

  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded || !user) return;

      try {
        setMode("loading");
        setError("");

        const currentProfile = await ensureUserProfile({
          user,
          getToken,
        });

        setProfile(currentProfile);

        if (currentProfile.vault_initialized && currentProfile.vault_salt) {
          setMode("unlock");
        } else {
          setMode("setup");
        }
      } catch (error) {
        console.error("Load vault profile failed:", error);
        setError("Could not load vault profile. Please refresh and try again.");
        setMode("unlock");
      }
    }

    loadProfile();
  }, [isLoaded, user, getToken]);

  function validateSetupPasswords() {
    if (masterPassword.length < 10) {
      return "Use a master password with at least 10 characters.";
    }

    if (masterPassword !== confirmMasterPassword) {
      return "Master passwords do not match.";
    }

    return "";
  }

  async function handleSetupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !profile) {
      setError("User profile is not ready yet.");
      return;
    }

    const validationError = validateSetupPasswords();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setInfoMessage("Setting up your encrypted vault...");

      const newSalt = arrayBuffertoBase64(generateSalt());

      const updatedProfile = await completeVaultSetup({
        profileId: profile.id,
        vaultSalt: newSalt,
        getToken,
      });

      await unlockVault({
        masterPassword,
        vaultSalt: newSalt,
      });

      setProfile(updatedProfile);
      setMode("unlock");
      setMasterPassword("");
      setConfirmMasterPassword("");
      setInfoMessage("Vault setup complete. Your vault is now unlocked.");
    } catch (error) {
      console.error("Vault setup failed:", error);
      setError("Could not complete vault setup. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUnlockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile?.vault_salt) {
      setError("Vault salt is missing. Vault setup may be incomplete.");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");
      setInfoMessage("");

      await unlockVault({
        masterPassword,
        vaultSalt: profile.vault_salt,
      });

      setMasterPassword("");
      setInfoMessage("Vault unlocked.");
    } catch (error) {
      console.error("Vault unlock failed:", error);
      setError(
        "Could not unlock vault. Check your master password and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Unlocked: compact status strip ───────────────────────────────────────
  if (isUnlocked) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-vault-card border border-emerald-300/15 bg-emerald-500/[0.06] px-5 py-3.5">
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Vault unlocked</p>
          <p className="mt-0.5 text-xs text-emerald-800/55 dark:text-emerald-300/55">
            Key active in browser memory · auto-locks after{" "}
            {Math.round(autoLockDurationMs / 60000)} min
            {lastActivityAt &&
              ` · active ${new Date(lastActivityAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
          </p>
        </div>
        <button
          type="button"
          onClick={lockVault}
          className="rounded-vault-chip border border-emerald-300/20 px-4 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-200/75 transition hover:bg-emerald-300/10"
        >
          Lock
        </button>
      </div>
    );
  }

  // ── Loading: centered pulse ───────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="flex min-h-[56vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-vault-chip bg-vault-accent/10 font-display text-xl font-medium text-vault-accent">
            {bMemoryVaultTheme.ownerInitial}
          </div>
          <p className="text-xs text-vault-text-faint">Preparing your vault…</p>
        </div>
      </div>
    );
  }

  // Monogram badge — shared between setup and unlock
  const monogram = (
    <div className="mb-7 flex justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-vault-chip bg-vault-accent/10 font-display text-[1.375rem] font-medium text-vault-accent shadow-lg shadow-vault-accent/20">
        {bMemoryVaultTheme.ownerInitial}
      </div>
    </div>
  );

  // ── Setup: first-time vault creation ─────────────────────────────────────
  if (mode === "setup") {
    return (
      <div className={cardShellCls}>
        <div className={cardInnerCls}>
          {monogram}

          <div className="mb-6 text-center">
            <h1 className="font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
              {bMemoryVaultTheme.copy.setupTitle}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-vault-text-muted">
              {bMemoryVaultTheme.copy.setupSubtitle}
            </p>
          </div>

          <div className="mb-5 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
            <p className="text-xs leading-relaxed text-vault-text-muted">
              {bMemoryVaultTheme.copy.setupNotice}
            </p>
          </div>

          <form onSubmit={handleSetupSubmit} className="grid gap-3">
            <input
              type="password"
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              className={inputCls}
              placeholder="Create master password"
              autoComplete="new-password"
            />

            <input
              type="password"
              value={confirmMasterPassword}
              onChange={(event) =>
                setConfirmMasterPassword(event.target.value)
              }
              className={inputCls}
              placeholder="Confirm master password"
              autoComplete="new-password"
            />

            {error && <p className="text-xs text-red-400/80">{error}</p>}
            {infoMessage && (
              <p className="text-xs text-vault-text-muted">{infoMessage}</p>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className={primaryBtnCls}
            >
              {isProcessing ? "Setting up…" : "Create & Unlock Vault"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Unlock: main recurring state ──────────────────────────────────────────
  return (
    <div className={cardShellCls}>
      <div className={cardInnerCls}>
        {monogram}

        <div className="mb-7 text-center">
          <h1 className="font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
            {bMemoryVaultTheme.copy.unlockTitle}
          </h1>
          <p className="mt-2 text-sm text-vault-text-muted">
            {bMemoryVaultTheme.copy.unlockSubtitle}
          </p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="grid gap-3">
          <input
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            className={inputCls}
            placeholder="Master password"
            autoComplete="current-password"
            autoFocus
          />

          {error && <p className="text-xs text-red-400/80">{error}</p>}
          {infoMessage && (
            <p className="text-xs text-vault-text-muted">{infoMessage}</p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className={primaryBtnCls}
          >
            {isProcessing ? "Unlocking…" : bMemoryVaultTheme.copy.unlockButton}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-vault-text-faint">
          Your master password never leaves this browser and cannot be
          recovered.
        </p>
      </div>
    </div>
  );
}
