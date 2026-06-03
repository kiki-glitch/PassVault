"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { encryptVaultItemUpdate } from "@/lib/crypto/vaultCrypto";
import { updateVaultItem } from "@/lib/supabase/vaultItems";
import { useVault } from "./VaultProvider";
import type { DecryptedVaultItem, VaultItemFormValues } from "@/types/vault";
import { currentUser } from "@clerk/nextjs/server";
import { generatePassword } from "@/lib/crypto/passwordGenerator";

export function EditPasswordForm({
    item,
  onCancel,
  onUpdated,
}: {
  item: DecryptedVaultItem;
  onCancel: () => void;
  onUpdated: () => Promise<void>;
}){
    const {getToken} = useAuth();
    const {isUnlocked, vaultKey, vaultSalt} = useVault();

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
    ){
        setValues((current) => ({
            ...current,
            [field]:value,
        }))
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

    async function handleSubmit(event: FormEvent<HTMLFormElement>){
        event.preventDefault();

        if(!isUnlocked || !vaultKey || !vaultSalt){
            setMessage("Unlock the vault before editing this password.");
            return;
        }

        if (!values.title.trim() || !values.password.trim()) {
            setMessage("Title and password are required.");
            return;
        }

        try{
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

    return(
        <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-pink-300/20 bg-pink-500/5 p-4"
        >
        <div className="mb-4">
            <p className="text-sm text-pink-300">Editing</p>
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
            <span className="text-sm text-slate-300">Title</span>
            <input
                value={values.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
            />
            </label>

            <label className="grid gap-2">
            <span className="text-sm text-slate-300">Username / Email</span>
            <input
                value={values.username}
                onChange={(event) => updateField("username", event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
            />
            </label>

            <label className="grid gap-2">
                <span className="text-sm text-slate-300">Password</span>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={values.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
                    />

                    <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="rounded-2xl border border-blue-300/30 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-300/10"
                    >
                        Generate
                    </button>
                </div>
            </label>

            <label className="grid gap-2">
            <span className="text-sm text-slate-300">Website URL</span>
            <input
                value={values.url}
                onChange={(event) => updateField("url", event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
            />
            </label>

            <label className="grid gap-2 md:col-span-2">
            <span className="text-sm text-slate-300">Notes</span>
            <textarea
                value={values.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="min-h-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
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
                className="rounded-full bg-pink-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-pink-300 disabled:cursor-not-allowed disabled:opacity-60"
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