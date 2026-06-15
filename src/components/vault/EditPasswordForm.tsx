"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptVaultItemUpdate } from "@/lib/crypto/vaultCrypto";
import { updateVaultItem } from "@/lib/supabase/vaultItems";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem, VaultItemFormValues } from "@/types/vault";
import { generatePassword } from "@/lib/crypto/passwordGenerator";

const inputCls =
  "w-full rounded-vault-input border border-vault-border bg-vault-inset px-4 py-3 text-sm " +
  "text-vault-text placeholder:text-vault-text-faint outline-none transition focus:border-vault-accent/50";

const labelCls = "text-xs font-medium text-vault-text-muted";

export function EditPasswordForm({
  item,
  onCancel,
  onUpdated,
}: {
  item: DecryptedVaultItem;
  onCancel: () => void;
  onUpdated: () => Promise<void>;
}) {
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey, vaultSalt } = useVault();

  const [values, setValues] = useState<VaultItemFormValues>({
    title: item.title,
    username: item.username,
    password: item.password,
    url: item.url,
    notes: item.notes,
    favorite: item.favorite,
  });

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

    if (!isUnlocked || !vaultKey || !vaultSalt) {
      setMessage("Unlock the vault before editing this password.");
      return;
    }

    if (!values.title.trim() || !values.password.trim()) {
      setMessage("Title and password are required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("Encrypting updates...");

      const encryptedUpdate = await encryptVaultItemUpdate({
        values,
        key: vaultKey,
        salt: vaultSalt,
      });

      await updateVaultItem({
        getToken,
        itemId: item.id,
        item: encryptedUpdate,
      });

      setMessage("Password updated securely.");
      await onUpdated();
    } catch (error) {
      console.error("Update password failed:", error);
      setMessage("Could not update password. Check console.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-vault-card border border-vault-accent/15 bg-vault-card p-5"
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          Editing
        </p>
        <h3 className="mt-1 font-display text-base font-medium text-vault-text">
          {item.title}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={labelCls}>Title</span>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className={inputCls}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Username / Email</span>
          <input
            value={values.username}
            onChange={(event) => updateField("username", event.target.value)}
            className={inputCls}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Password</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              className={inputCls + " min-w-0 flex-1"}
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
          />
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className={labelCls}>Notes</span>
          <textarea
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className={inputCls + " min-h-20 resize-none"}
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-vault-text-muted">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(event) => updateField("favorite", event.target.checked)}
            className="accent-[var(--vault-accent)]"
          />
          Mark as favorite
        </label>
      </div>

      {message && <p className="mt-4 text-xs text-vault-text-muted">{message}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-vault-input bg-vault-accent px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-vault-input border border-vault-border px-6 py-2.5 text-sm font-medium text-vault-text-muted transition hover:bg-vault-overlay/[0.04]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
