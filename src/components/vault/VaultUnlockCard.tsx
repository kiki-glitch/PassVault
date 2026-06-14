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

  if (isUnlocked) {
    return (
      <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-6">
        <p className="text-sm text-emerald-200">Vault unlocked</p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Your safe little corner is open.
        </h2>

        <p className="mt-2 text-sm text-emerald-100/80">
          Encryption key is active in browser memory only. The vault auto-locks
          after {Math.round(autoLockDurationMs / 60000)} minutes of inactivity.
        </p>

        {lastActivityAt && (
          <p className="mt-2 text-xs text-emerald-100/60">
            Last activity recorded at{" "}
            {new Date(lastActivityAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </p>
        )}

        <button
          type="button"
          onClick={lockVault}
          className="mt-5 rounded-full border border-emerald-300/30 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/10"
        >
          Lock Vault
        </button>
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-blue-300">Checking vault status...</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Preparing your vault
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          We are checking whether this vault has already been set up.
        </p>
      </div>
    );
  }

  if (mode === "setup") {
    return (
      <div className="rounded-3xl border border-pink-300/20 bg-white/5 p-6 shadow-lg shadow-pink-500/10">
        <p className="text-sm text-pink-300">First-time vault setup</p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Create B’s master password
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          This password unlocks encrypted passwords and notes. It is different
          from the account login password.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-semibold text-yellow-100">
            Important: this cannot be recovered.
          </p>
          <p className="mt-2 text-sm leading-6 text-yellow-100/80">
            Because this is a zero-knowledge vault, the master password is never
            sent to the server or stored anywhere. If it is forgotten, saved
            vault data cannot be decrypted.
          </p>
        </div>

        <form onSubmit={handleSetupSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Master Password</span>

            <input
              type="password"
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-pink-300"
              placeholder="Create vault master password"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">
              Confirm Master Password
            </span>

            <input
              type="password"
              value={confirmMasterPassword}
              onChange={(event) =>
                setConfirmMasterPassword(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-pink-300"
              placeholder="Repeat vault master password"
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}
          {infoMessage && <p className="text-sm text-blue-200">{infoMessage}</p>}

          <button
            type="submit"
            disabled={isProcessing}
            className="rounded-full bg-pink-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? "Setting up..." : "Create & Unlock Vault"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-pink-300/20 bg-white/5 p-6 shadow-lg shadow-pink-500/10">
      <p className="text-sm text-pink-300">{bMemoryVaultTheme.copy.vaultLocked}</p>

      <h2 className="mt-2 text-2xl font-bold text-white">
        {bMemoryVaultTheme.copy.unlockTitle}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {bMemoryVaultTheme.copy.unlockSubtitle}
      </p>

      <form onSubmit={handleUnlockSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Master Password</span>

          <input
            type="password"
            value={masterPassword}
            onChange={(event) => setMasterPassword(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-pink-300"
            placeholder="Enter vault master password"
          />
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {infoMessage && <p className="text-sm text-blue-200">{infoMessage}</p>}

        <button
          type="submit"
          disabled={isProcessing}
          className="rounded-full bg-pink-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isProcessing ? "Unlocking..." : bMemoryVaultTheme.copy.unlockButton}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Your master password never leaves this browser.
      </p>
    </div>
  );
}