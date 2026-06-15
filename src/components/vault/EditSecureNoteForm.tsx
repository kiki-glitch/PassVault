"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptSecureNoteUpdate } from "@/lib/crypto/vaultCrypto";
import { updateSecureNote } from "@/lib/supabase/secureNotes";
import { useVault } from "./VaultProvider";
import type { DecryptedSecureNote, SecureNoteFormValues } from "@/types/vault";

const inputCls =
  "w-full rounded-vault-input border border-white/10 bg-black/30 px-4 py-3 text-sm " +
  "text-white placeholder:text-white/25 outline-none transition focus:border-vault-accent/50";

const labelCls = "text-xs font-medium text-white/50";

export function EditSecureNoteForm({
  note,
  onCancel,
  onUpdated,
}: {
  note: DecryptedSecureNote;
  onCancel: () => void;
  onUpdated: () => Promise<void>;
}) {
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey, vaultSalt } = useVault();

  const [values, setValues] = useState<SecureNoteFormValues>({
    title: note.title,
    content: note.content,
    favorite: note.favorite,
  });

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isUnlocked || !vaultKey || !vaultSalt) {
      setMessage("Unlock the vault before editing this note.");
      return;
    }

    if (!values.title.trim() || !values.content.trim()) {
      setMessage("Title and note content are required.");
      return;
    }

    try {
      setIsSaving(true);
      setMessage("Encrypting updates...");

      const encryptedUpdate = await encryptSecureNoteUpdate({
        values,
        key: vaultKey,
        salt: vaultSalt,
      });

      await updateSecureNote({
        getToken,
        noteId: note.id,
        note: encryptedUpdate,
      });

      setMessage("Note updated securely.");
      await onUpdated();
    } catch (error) {
      console.error("Update secure note failed:", error);
      setMessage("Could not update note. Check console.");
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
        <h3 className="mt-1 font-display text-base font-medium text-white">
          {note.title}
        </h3>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className={labelCls}>Title</span>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className={inputCls}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={labelCls}>Note</span>
          <textarea
            value={values.content}
            onChange={(event) => updateField("content", event.target.value)}
            className={inputCls + " min-h-36 resize-none"}
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
          className="rounded-vault-input border border-white/10 px-6 py-2.5 text-sm font-medium text-white/50 transition hover:bg-white/[0.04]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
