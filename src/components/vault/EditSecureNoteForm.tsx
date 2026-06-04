"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptSecureNoteUpdate } from "@/lib/crypto/vaultCrypto";
import { updateSecureNote } from "@/lib/supabase/secureNotes";
import { useVault } from "./VaultProvider";
import type { DecryptedSecureNote, SecureNoteFormValues } from "@/types/vault";

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
      className="rounded-2xl border border-blue-300/20 bg-blue-500/5 p-4"
    >
      <div className="mb-4">
        <p className="text-sm text-blue-300">Editing note</p>
        <h3 className="text-lg font-semibold text-white">{note.title}</h3>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Title</span>
          <input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-300"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm text-slate-300">Note</span>
          <textarea
            value={values.content}
            onChange={(event) => updateField("content", event.target.value)}
            className="min-h-32 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-300"
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

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-blue-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}