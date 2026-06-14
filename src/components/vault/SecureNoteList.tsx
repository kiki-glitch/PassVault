"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptSecureNote } from "@/lib/crypto/vaultCrypto";
import { deleteSecureNote, getSecureNotes } from "@/lib/supabase/secureNotes";
import { useVault } from "./VaultProvider";
import { EditSecureNoteForm } from "./EditSecureNoteForm";
import type { DecryptedSecureNote } from "@/types/vault";
import { bMemoryVaultTheme } from "@/config/themes";

export function SecureNoteList({
  refreshKey,
  onChanged,
}: {
  refreshKey: number;
  onChanged: () => void;
}) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey } = useVault();

  const [notes, setNotes] = useState<DecryptedSecureNote[]>([]);
  const [message, setMessage] = useState("Unlock the vault to load notes.");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });
  }, [notes, searchQuery]);

  async function loadNotes() {
    if (!isLoaded || !user) return;

    if (!isUnlocked || !vaultKey) {
      setNotes([]);
      setEditingNoteId(null);
      setMessage("Unlock the vault to load notes.");
      return;
    }

    try {
      setMessage("Loading encrypted notes...");

      const encryptedRows = await getSecureNotes({
        getToken,
      });

      const decryptedNotes = await Promise.all(
        encryptedRows.map((row) =>
          decryptSecureNote({
            row,
            key: vaultKey,
          })
        )
      );

      setNotes(decryptedNotes);
      setMessage(
        decryptedNotes.length > 0
          ? "Notes loaded and decrypted in your browser."
          : "No secure notes saved yet."
      );
    } catch (error) {
      console.error("Load secure notes failed:", error);
      setNotes([]);
      setMessage("Could not load notes. Check console.");
    }
  }

  async function handleDelete(note: DecryptedSecureNote) {
    const confirmed = window.confirm(
      `Delete "${note.title}" from your notes? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteSecureNote({
        getToken,
        noteId: note.id,
      });

      setEditingNoteId(null);
      setMessage("Note deleted.");
      onChanged();
    } catch (error) {
      console.error("Delete secure note failed:", error);
      setMessage("Could not delete note.");
    }
  }

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isUnlocked, vaultKey, refreshKey]);

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm text-blue-300">{bMemoryVaultTheme.labels.notes}</p>
          <h2 className="mt-2 text-2xl font-bold">{bMemoryVaultTheme.labels.notes}</h2>
          <p className="mt-2 text-sm text-slate-400">{message}</p>
        </div>

        <label className="grid gap-2 lg:w-80">
          <span className="text-sm text-slate-300">Search notes</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!isUnlocked}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search title or note content"
          />
        </label>
      </div>

      {!isUnlocked && (
        <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-100">
            Unlock the vault to view and search secure notes.
          </p>
        </div>
      )}

      {isUnlocked && notes.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-lg font-semibold text-white">
            No secure notes yet.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Add your first private note using the form below.
          </p>
        </div>
      )}

      {isUnlocked && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-lg font-semibold text-white">No matches found.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try searching by note title or content.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {filteredNotes.map((note) => {
          if (editingNoteId === note.id) {
            return (
              <EditSecureNoteForm
                key={note.id}
                note={note}
                onCancel={() => setEditingNoteId(null)}
                onUpdated={async () => {
                  setEditingNoteId(null);
                  setMessage("Note updated securely.");
                  onChanged();
                }}
              />
            );
          }

          return (
            <div
              key={note.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {note.title}
                    </h3>

                    {note.favorite && (
                      <span className="rounded-full bg-blue-400/20 px-2 py-1 text-xs text-blue-200">
                        {bMemoryVaultTheme.labels.favorites}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                    {note.content}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNoteId(note.id)}
                    className="rounded-full border border-blue-300/30 px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-300/10"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    className="rounded-full border border-red-300/30 px-4 py-2 text-xs font-semibold text-red-200 hover:bg-red-300/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}