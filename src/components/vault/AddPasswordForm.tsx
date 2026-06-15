"use client";

import { FormEvent, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { createVault, getVaults } from "@/lib/supabase/vaults";
import { createVaultItem } from "@/lib/supabase/vaultItems";
import { encryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { useVault } from "./VaultProvider";
import type { VaultItemFormValues } from "@/types/vault";
import { generatePassword } from "@/lib/crypto/passwordGenerator";
import { bMemoryVaultTheme } from "@/config/themes";

const initialFormValues: VaultItemFormValues = {
  title: "",
  username: "",
  password: "",
  url: "",
  notes: "",
  favorite: false,
};

const inputCls =
  "w-full rounded-vault-input border border-white/10 bg-black/30 px-4 py-3 text-sm " +
  "text-white placeholder:text-white/25 outline-none transition focus:border-vault-accent/50";

const labelCls = "text-xs font-medium text-white/50";

const submitBtnCls =
  "mt-6 w-full rounded-vault-input bg-vault-accent px-8 py-3 text-sm font-semibold " +
  "text-slate-950 transition hover:opacity-90 sm:w-auto " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export function AddPasswordForm({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey, vaultSalt } = useVault();

  const [values, setValues] = useState<VaultItemFormValues>(initialFormValues);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField<Field extends keyof VaultItemFormValues>(
    field: Field,
    value: VaultItemFormValues[Field]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function getOrCreateDefaultVault(profileId: string) {
    const vaults = await getVaults(getToken);

    if (vaults.length > 0) {
      return vaults[0];
    }

    return createVault({
      profileId,
      getToken,
      name: "B's Main Vault",
      description: "Default vault for saved keys.",
    });
  }

  function handleGeneratePassword() {
    try {
      const password = generatePassword({
        length: 18,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      });

      updateField("password", password);
      setMessage("Strong password generated locally.");
    } catch (error) {
      console.error("Generate password failed:", error);
      setMessage("Could not generate password.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("You must be signed in to save a password.");
      return;
    }

    if (!isUnlocked || !vaultKey || !vaultSalt) {
      setMessage("Unlock the vault before saving a password.");
      return;
    }

    if (!values.title.trim() || !values.password.trim()) {
      setMessage("Title and password are required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("Encrypting and saving password...");

      const profile = await ensureUserProfile({
        user,
        getToken,
      });

      const vault = await getOrCreateDefaultVault(profile.id);

      const encryptedItem = await encryptVaultItem({
        values,
        key: vaultKey,
        ownerId: profile.id,
        vaultId: vault.id,
        salt: vaultSalt,
      });

      await createVaultItem({
        getToken,
        item: encryptedItem,
      });

      setValues(initialFormValues);
      setMessage("Password saved securely.");
      await onCreated();
    } catch (error) {
      console.error("Save password failed:", error);
      setMessage("Could not save password. Check console.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-vault-panel border border-white/8 bg-vault-card p-6"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          {bMemoryVaultTheme.labels.passwords}
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-white">
          Add a password
        </h2>
        <p className="mt-1.5 text-sm text-white/45">
          This form encrypts the password in your browser before saving it.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={labelCls}>Title</span>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className={inputCls}
            placeholder="Netflix"
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Username / Email</span>
          <input
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            className={inputCls}
            placeholder="b@example.com"
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Password</span>
          <div className="flex gap-2">
            <input
              type="password"
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={inputCls + " min-w-0 flex-1"}
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="rounded-vault-input border border-vault-support/20 px-4 py-3 text-sm font-medium text-vault-support/70 transition hover:bg-vault-support/[0.06]"
            >
              Generate
            </button>
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Website URL</span>
          <input
            value={values.url}
            onChange={(event) => updateField("url", event.target.value)}
            className={inputCls}
            placeholder="https://example.com"
          />
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className={labelCls}>Notes</span>
          <textarea
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className={inputCls + " min-h-20 resize-none"}
            placeholder="Optional note"
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-white/45">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(event) => updateField("favorite", event.target.checked)}
            className="accent-[var(--vault-accent)]"
          />
          Mark as favorite
        </label>
      </div>

      {message && <p className="mt-4 text-xs text-white/45">{message}</p>}

      <button type="submit" disabled={isSaving} className={submitBtnCls}>
        {isSaving ? "Saving..." : "Save Password"}
      </button>
    </form>
  );
}
