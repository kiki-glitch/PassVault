"use client";

import { FormEvent, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useVault } from "./VaultProvider";
import { bMemoryVaultTheme } from "@/config/themes";
import {
  ensureUserProfile,
  updateUserVaultSalt,
} from "@/lib/supabase/profile";
import {
  arrayBuffertoBase64,
  generateSalt,
} from "@/lib/crypto/vaultCrypto";

export function VaultUnlockCard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const {
  isUnlocked,
  unlockVault,
  lockVault,
  lastActivityAt,
  autoLockDurationMs,
} = useVault();

  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);

  async function getOrCreateVaultSalt() {
    if (!user) {
      throw new Error("User is required.");
    }

    const profile = await ensureUserProfile({
      user,
      getToken,
    });

    if (profile.vault_salt) {
      return profile.vault_salt;
    }

    const newSalt = arrayBuffertoBase64(generateSalt());

    await updateUserVaultSalt({
      profileId: profile.id,
      vaultSalt: newSalt,
      getToken,
    });

    return newSalt;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      setIsUnlocking(true);

      const vaultSalt = await getOrCreateVaultSalt();

      await unlockVault({
        masterPassword,
        vaultSalt,
      });

      setMasterPassword("");
    } catch (error) {
      console.error(error);
      setError("Could not unlock vault. Please check your master password.");
    } finally {
      setIsUnlocking(false);
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
            Encryption key is active in browser memory only. The vault auto-locks after{" "}
            {Math.round(autoLockDurationMs / 60000)} minutes of inactivity.
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

  return (
    <div className="rounded-3xl border border-pink-300/20 bg-white/5 p-6 shadow-lg shadow-pink-500/10">
      <p className="text-sm text-pink-300">Vault locked</p>

      <h2 className="mt-2 text-2xl font-bold text-white">
        {bMemoryVaultTheme.copy.unlockTitle}
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        {bMemoryVaultTheme.copy.unlockSubtitle}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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

        <button
          type="submit"
          disabled={isUnlocking}
          className="rounded-full bg-pink-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUnlocking ? "Unlocking..." : bMemoryVaultTheme.copy.unlockButton}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500">
        Your master password never leaves this browser.
      </p>
    </div>
  );
}