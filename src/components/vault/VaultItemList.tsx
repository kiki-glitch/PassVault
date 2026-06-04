"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { decryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { getVaultItems, deleteVaultItem } from "@/lib/supabase/vaultItems";
import { getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem } from "@/types/vault";
import { EditPasswordForm } from "./EditPasswordForm";

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
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm text-pink-300">Your saved keys</p>
          <h2 className="mt-2 text-2xl font-bold">Passwords</h2>
          <p className="mt-2 text-sm text-slate-400">{message}</p>
        </div>

        <label className="grid gap-2 lg:w-80">
          <span className="text-sm text-slate-300">Search vault</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={!isUnlocked}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-pink-300 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search title, username, or URL"
          />
        </label>
      </div>

      {!isUnlocked && (
        <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-100">
            Unlock the vault to view and search saved passwords.
          </p>
        </div>
      )}

      {isUnlocked && items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-lg font-semibold text-white">
            No saved passwords yet.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Add your first saved key using the form below.
          </p>
        </div>
      )}

      {isUnlocked && items.length > 0 && filteredItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-lg font-semibold text-white">No matches found.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try searching by title, username, or website URL.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {filteredItems.map((item) => {
          const isPasswordVisible = visiblePasswordId === item.id;

          if (editingItemId === item.id) {
            return (
              <EditPasswordForm
                key={item.id}
                item={item}
                onCancel={() => setEditingItemId(null)}
                onUpdated={async () => {
                  setEditingItemId(null);
                  setVisiblePasswordId(null);
                  setRefreshKey((current) => current + 1);
                  setMessage("Password updated securely.");
                }}
              />
            );
          }

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-4"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {item.title}
                    </h3>

                    {item.favorite && (
                      <span className="rounded-full bg-pink-400/20 px-2 py-1 text-xs text-pink-200">
                        Favorite
                      </span>
                    )}
                  </div>

                  {item.username && (
                    <p className="mt-2 text-sm text-slate-300">
                      Username: {item.username}
                    </p>
                  )}

                  {item.url && (
                    <p className="mt-1 break-all text-sm text-blue-200">
                      {item.url}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-slate-300">
                    Password:{" "}
                    <span className="font-mono">
                      {isPasswordVisible ? item.password : "••••••••••••"}
                    </span>
                  </p>

                  {item.notes && (
                    <p className="mt-2 text-sm text-slate-400">{item.notes}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItemId(item.id)}
                    className="rounded-full border border-pink-300/30 px-4 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-300/10"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReveal(item.id)}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    {isPasswordVisible ? "Hide" : "Reveal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyPassword(item.password)}
                    className="rounded-full border border-blue-300/30 px-4 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-300/10"
                  >
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
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