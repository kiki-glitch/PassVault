"use client";

import { FormEvent, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { encryptSecureNote } from "@/lib/crypto/vaultCrypto";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { createVault, getVaults } from "@/lib/supabase/vaults";
import { createSecureNote } from "@/lib/supabase/secureNotes";
import { useVault } from "./VaultProvider";
import type { SecureNoteFormValues } from "@/types/vault";
import { bMemoryVaultTheme } from "@/config/themes";

const initialFormValues: SecureNoteFormValues = {
  title: "",
  content: "",
  favorite: false,
};

export function AddSecureNoteForm({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey, vaultSalt } = useVault();

  const [values, setValues] = useState<SecureNoteFormValues>(initialFormValues);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField<Field extends keyof SecureNoteFormValues>(
    field: Field,
    value: SecureNoteFormValues[Field]
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
      name: "B’s Main Vault",
      description: "Default vault for saved keys and little notes.",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("You must be signed in to save a note.");
      return;
    }

    if (!isUnlocked || !vaultKey || !vaultSalt) {
      setMessage("Unlock the vault before saving a note.");
      return;
    }

    if (!values.title.trim() || !values.content.trim()) {
      setMessage("Title and note content are required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("Encrypting and saving note...");

      const profile = await ensureUserProfile({
        user,
        getToken,
      });

      const vault = await getOrCreateDefaultVault(profile.id);

      const encryptedNote = await encryptSecureNote({
        values,
        key: vaultKey,
        ownerId: profile.id,
        vaultId: vault.id,
        salt: vaultSalt,
      });

      await createSecureNote({
        getToken,
        note: encryptedNote,
      });

      setValues(initialFormValues);
      setMessage("Note saved securely.");
      await onCreated();
    } catch (error) {
      console.error("Save secure note failed:", error);
      setMessage("Could not save note. Check console.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <div>
        <p className="text-sm text-blue-300">{bMemoryVaultTheme.labels.notes}</p>
        <h2 className="mt-2 text-2xl font-bold">Add a secure note</h2>
        <p className="mt-2 text-sm text-slate-400">
          Notes are encrypted in your browser before being saved.
        </p>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Title</span>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-300"
            placeholder="Gift ideas, travel plans, reminders..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Note</span>
          <textarea
            value={values.content}
            onChange={(event) => updateField("content", event.target.value)}
            className="min-h-32 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-300"
            placeholder="Write a private note..."
          />
        </label>

        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={values.favorite}
            onChange={(event) => updateField("favorite", event.target.checked)}
          />
          Mark as favorite
        </label>
      </div>

      {message && <p className="mt-4 text-sm text-blue-200">{message}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 rounded-full bg-blue-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Note"}
      </button>
    </form>
  );
}