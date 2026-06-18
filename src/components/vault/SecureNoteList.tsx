"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptSecureNote } from "@/lib/crypto/vaultCrypto";
import { deleteSecureNote, getSecureNotes } from "@/lib/supabase/secureNotes";
import { useVault } from "./VaultProvider";
import { EditSecureNoteForm } from "./EditSecureNoteForm";
import type { DecryptedSecureNote } from "@/types/vault";
import { bMemoryVaultTheme } from "@/config/themes";

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const inputCls =
  "w-full rounded-vault-input border border-vault-border bg-vault-inset px-4 py-3 text-sm " +
  "text-vault-text placeholder:text-vault-text-faint outline-none transition focus:border-vault-accent/50";

const actionBtnCls =
  "rounded-vault-chip border border-vault-border px-2.5 py-1 text-xs font-medium " +
  "text-vault-text-muted transition hover:bg-vault-overlay/[0.06] hover:text-vault-text/80";

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isUnlocked, vaultKey, refreshKey]);

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
            {bMemoryVaultTheme.labels.notes}
          </p>
          <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
            {bMemoryVaultTheme.labels.notes}
          </h2>
          <p className="mt-1.5 text-sm text-vault-text-muted">{message}</p>
        </div>

        <label className="lg:w-72">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!isUnlocked}
            className={inputCls + " disabled:cursor-not-allowed disabled:opacity-40"}
            placeholder="Search title or note content"
          />
        </label>
      </div>

      {/* Defense-in-depth locked notice */}
      {!isUnlocked && (
        <div className="mt-5 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
          <p className="text-xs text-vault-text-muted">
            Unlock the vault to view and search secure notes.
          </p>
        </div>
      )}

      {/* Empty states */}
      {isUnlocked && notes.length === 0 && (
        <div className="mt-5 rounded-vault-card border border-vault-border bg-vault-card p-8 text-center">
          <p className="font-display text-base font-medium text-vault-text/70">
            No secure notes yet.
          </p>
          <p className="mt-1.5 text-sm text-vault-text-faint">
            Add your first private note using the form below.
          </p>
        </div>
      )}

      {isUnlocked && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="mt-5 rounded-vault-card border border-vault-border bg-vault-card p-8 text-center">
          <p className="font-display text-base font-medium text-vault-text/70">
            No matches found.
          </p>
          <p className="mt-1.5 text-sm text-vault-text-faint">
            Try searching by note title or content.
          </p>
        </div>
      )}

      {/* Note card grid — minmax(260px) wider than password tiles for prose readability */}
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {filteredNotes.map((note) => {
          if (editingNoteId === note.id) {
            return (
              <div key={note.id} className="col-span-full">
                <EditSecureNoteForm
                  note={note}
                  onCancel={() => setEditingNoteId(null)}
                  onUpdated={async () => {
                    setEditingNoteId(null);
                    setMessage("Note updated securely.");
                    onChanged();
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={note.id}
              className="flex flex-col rounded-vault-card border border-vault-border border-l-2 border-l-vault-accent/20 bg-vault-card p-4"
            >
              {/* Title + favorite heart */}
              <div className="flex items-start gap-2">
                <h3 className="flex-1 font-display text-base font-medium leading-snug text-vault-text">
                  {note.title}
                </h3>
                {note.favorite && (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-vault-accent/60"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                )}
              </div>

              {/* Content preview — prose treatment */}
              <p className="mt-2.5 line-clamp-4 text-sm leading-relaxed text-vault-text-muted">
                {note.content}
              </p>

              {/* Timestamp + actions */}
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-xs text-vault-text-faint">
                  added {relativeDate(note.createdAt)}
                </span>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingNoteId(note.id)}
                    className={actionBtnCls}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note)}
                    className="rounded-vault-chip border border-transparent px-2.5 py-1 text-xs font-medium text-red-400/55 transition hover:bg-red-400/10 hover:text-red-300"
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
