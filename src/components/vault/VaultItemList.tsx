"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { decryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { getVaultItems, deleteVaultItem } from "@/lib/supabase/vaultItems";
import { getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem } from "@/types/vault";

export function VaultItemList() {
    const {user, isLoaded} = useUser();
    const { getToken } = useAuth();
    const {isUnlocked, vaultKey} = useVault();

    const[items, setItems] = useState<DecryptedVaultItem[]>([]);
    const [message, setMessage] = useState("Unlock the vault to load passwords.");
    const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    async function loadItems(){
        if (!isLoaded || !user) return;

        if (!isUnlocked || !vaultKey) {
            setItems([]);
            setMessage("Unlock the vault to load passwords.");
            return;
        }

        try{
            setMessage("Loading encrypted passwords...");

            const clerkToken = await getToken();

            if(!clerkToken) {
                throw new Error("Could not retrieve Clerk token.")
            }

            const vaults = await getVaults(clerkToken);

            if(vaults.length === 0){
                setItems([]);
                setMessage("NO vault yet. Add your first password to create one.");
                return;
            }

            const vault = vaults[0];

            const encryptedRows = await getVaultItems({
                clerkToken,
                vaultId:vault.id,
            })

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

        }catch(error){
            console.error("Load vault items failed:", error);
            setItems([]);
            setMessage("COuld not load passwords. Check console.")
        }
    }

    async function handleDelete(itemId: string) {
        try{
            const clerkToken = await getToken();

            if(!clerkToken) {
                throw new Error("Could not retrieve CLerk token");
            }

            await deleteVaultItem({
                clerkToken,
                itemId,
            });

            setRefreshKey((current) => current + 1);
        }catch(error){
            console.error("Delete item failed:", error);
            setMessage("Could not delete password.");
        }
    }

    async function handleCopyPassword(password: string){
        try{
            await navigator.clipboard.writeText(password);
            setMessage("Password copied to clipboard.");
        }catch{
            setMessage("Could not copy password.");
        }
    }

    useEffect(() => {
        loadItems();
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, user, isUnlocked, vaultKey, refreshKey]);

    return(
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <div>
            <p className="text-sm text-pink-300">Your saved keys</p>
            <h2 className="mt-2 text-2xl font-bold">Passwords</h2>
            <p className="mt-2 text-sm text-slate-400">{message}</p>
        </div>

        <div className="mt-6 grid gap-4">
            {items.map((item) => {
            const isPasswordVisible = visiblePasswordId === item.id;

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
                        <p className="mt-1 text-sm text-blue-200">{item.url}</p>
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
                            onClick={() =>
                            setVisiblePasswordId(isPasswordVisible ? null : item.id)
                            }
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
                            onClick={() => handleDelete(item.id)}
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