"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { getVaultItems, deleteVaultItem } from "@/lib/supabase/vaultItems";
import { getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem } from "@/types/vault";
import { EditPasswordForm } from "./EditPasswordForm";
import { bMemoryVaultTheme } from "@/config/themes";

const inputCls =
  "w-full rounded-vault-input border border-white/10 bg-black/30 px-4 py-3 text-sm " +
  "text-white placeholder:text-white/25 outline-none transition focus:border-vault-accent/50";

const actionBtnCls =
  "rounded-vault-chip border border-white/8 px-2.5 py-1 text-xs font-medium " +
  "text-white/55 transition hover:bg-white/[0.06] hover:text-white/80";

export function VaultItemList() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey } = useVault();

  const [items, setItems] = useState<DecryptedVaultItem[]>([]);
  const [message, setMessage] = useState("Unlock the vault to load passwords.");
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  async function loadItems() {
    if (!isLoaded || !user) return;

    if (!isUnlocked || !vaultKey) {
      setItems([]);
      setVisiblePasswordId(null);
      setEditingItemId(null);
      setMessage("Unlock the vault to load passwords.");
      return;
    }

    try {
      setMessage("Loading encrypted passwords...");

      const vaults = await getVaults(getToken);

      if (vaults.length === 0) {
        setItems([]);
        setMessage("No vault yet. Add your first password to create one.");
        return;
      }

      const vault = vaults[0];

      const encryptedRows = await getVaultItems({
        getToken,
        vaultId: vault.id,
      });

      const decryptedItems = await Promise.all(
        encryptedRows.map((row) =>
          decryptVaultItem({
            row,
            key: vaultKey,
          })
        )
      );

      setItems(decryptedItems);
      setMessage(
        decryptedItems.length > 0
          ? "Passwords loaded and decrypted in your browser."
          : "No passwords saved yet."
      );
    } catch (error) {
      console.error("Load vault items failed:", error);
      setItems([]);
      setMessage("Could not load passwords. Check console.");
    }
  }

  async function handleDelete(item: DecryptedVaultItem) {
    const confirmed = window.confirm(
      `Delete "${item.title}" from your vault? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteVaultItem({
        getToken,
        itemId: item.id,
      });

      setVisiblePasswordId(null);
      setEditingItemId(null);
      setRefreshKey((current) => current + 1);
      setMessage("Password deleted.");
    } catch (error) {
      console.error("Delete item failed:", error);
      setMessage("Could not delete password.");
    }
  }

  async function handleCopyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setMessage("Password copied to clipboard.");

      window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {
          // Some browsers block clearing clipboard. That's okay.
        }
      }, 15000);
    } catch {
      setMessage("Could not copy password.");
    }
  }

  function handleReveal(itemId: string) {
    const nextVisibleId = visiblePasswordId === itemId ? null : itemId;
    setVisiblePasswordId(nextVisibleId);

    if (nextVisibleId) {
      window.setTimeout(() => {
        setVisiblePasswordId((current) =>
          current === nextVisibleId ? null : current
        );
      }, 10000);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, isUnlocked, vaultKey, refreshKey]);

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
            {bMemoryVaultTheme.labels.passwords}
          </p>
          <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-white">
            {bMemoryVaultTheme.labels.passwords}
          </h2>
          <p className="mt-1.5 text-sm text-white/45">{message}</p>
        </div>

        <label className="lg:w-72">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!isUnlocked}
            className={
              inputCls + " disabled:cursor-not-allowed disabled:opacity-40"
            }
            placeholder="Search title, username, or URL"
          />
        </label>
      </div>

      {/* Defense-in-depth locked notice */}
      {!isUnlocked && (
        <div className="mt-5 rounded-vault-chip border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-white/40">
            Unlock the vault to view and search saved passwords.
          </p>
        </div>
      )}

      {/* Empty states */}
      {isUnlocked && items.length === 0 && (
        <div className="mt-5 rounded-vault-card border border-white/8 bg-vault-card p-8 text-center">
          <p className="font-display text-base font-medium text-white/70">
            No saved passwords yet.
          </p>
          <p className="mt-1.5 text-sm text-white/35">
            Add your first saved key using the form below.
          </p>
        </div>
      )}

      {isUnlocked && items.length > 0 && filteredItems.length === 0 && (
        <div className="mt-5 rounded-vault-card border border-white/8 bg-vault-card p-8 text-center">
          <p className="font-display text-base font-medium text-white/70">
            No matches found.
          </p>
          <p className="mt-1.5 text-sm text-white/35">
            Try searching by title, username, or website URL.
          </p>
        </div>
      )}

      {/* Card grid */}
      <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {filteredItems.map((item) => {
          const isPasswordVisible = visiblePasswordId === item.id;

          if (editingItemId === item.id) {
            return (
              <div key={item.id} className="col-span-full">
                <EditPasswordForm
                  item={item}
                  onCancel={() => setEditingItemId(null)}
                  onUpdated={async () => {
                    setEditingItemId(null);
                    setVisiblePasswordId(null);
                    setRefreshKey((current) => current + 1);
                    setMessage("Password updated securely.");
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className="flex flex-col rounded-vault-card border border-white/8 bg-vault-card p-4"
            >
              {/* Tile header: initial badge + title / username / url */}
              <div className="flex items-start gap-3">
                {/* h-8 w-8 (32px) from default Tailwind scale */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-vault-chip bg-vault-accent/10 font-display text-xs font-medium text-vault-accent">
                  {item.title.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    {item.favorite && (
                      <svg
                        className="h-3.5 w-3.5 flex-shrink-0 text-vault-accent/60"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    )}
                  </div>

                  {item.username && (
                    <p className="mt-0.5 truncate text-xs text-white/45">
                      {item.username}
                    </p>
                  )}
                  {item.url && (
                    <p className="mt-0.5 truncate text-xs text-vault-support/60">
                      {item.url}
                    </p>
                  )}
                </div>
              </div>

              {/* Password row */}
              <div className="mt-3 rounded-vault-chip border border-white/8 bg-black/30 px-3 py-2">
                <p className="font-mono text-xs text-white/70">
                  {isPasswordVisible ? item.password : "••••••••••••"}
                </p>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="mt-2 line-clamp-2 text-xs text-white/35">
                  {item.notes}
                </p>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                <button
                  type="button"
                  onClick={() => handleReveal(item.id)}
                  className={actionBtnCls}
                >
                  {isPasswordVisible
                    ? bMemoryVaultTheme.copy.hidePassword
                    : bMemoryVaultTheme.copy.revealPassword}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyPassword(item.password)}
                  className={actionBtnCls}
                >
                  {bMemoryVaultTheme.copy.copyPassword}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingItemId(item.id)}
                  className={actionBtnCls}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded-vault-chip border border-transparent px-2.5 py-1 text-xs font-medium text-red-400/55 transition hover:bg-red-400/10 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
