"use client"

import { useState} from "react";
import {
    arrayBuffertoBase64,
    base64ToUint8Array,
    decryptText,
    deriveVaultKey,
    encryptText,
    generateSalt,
} from "@/lib/crypto/vaultCrypto";

export function EncryptionTest(){
    const [masterPassword, setMasterPassword] = useState("");
    const [secretText, setSecretText] = useState("Netflix password: Demo123!");
    const [encryptedText, setEncryptedText] = useState("");
    const[decryptedText, setDecryptedText] = useState("");
    const [saltBase64, setSaltBase64] = useState("");
    const [ivBase64, setIvBase64] = useState("");
    const [message, setMessage] = useState("");

    async function handleEncrypt(){
        try{
            if(!masterPassword || !secretText){
                setMessage("Enter a master password and secret text first.");
                return;
            }

            const salt = generateSalt();
            const key = await deriveVaultKey(masterPassword, salt);
            const encrypted = await encryptText(secretText, key);

            setSaltBase64(arrayBuffertoBase64(salt));
            setIvBase64(encrypted.iv)
            setEncryptedText(encrypted.ciphertext);
            setDecryptedText("");
            setMessage("Encrypted successfully.The database would only store ciphertext.");
        } catch(error){
            console.error(error);
            setMessage("Encyption failed. Check console.");
        }
    }

    async function handleDecrypt(){
        try{
            if(!masterPassword || !encryptedText || !saltBase64 || !ivBase64){
                setMessage("Encrypt something first, then try decrypting.");
                return;
            }

            const salt = base64ToUint8Array(saltBase64);
            const key = await deriveVaultKey(masterPassword, salt);

            const decrypted = await decryptText({
                ciphertext: encryptedText,
                iv: ivBase64,
                key,
            });

            setDecryptedText(decrypted);
            setMessage("Decrypted successfully.");
        }catch(error){
            console.error(error);
            setDecryptedText("")
            setMessage("Decryption failed. W rong master password or corrupted ciphertext.")
        }
    }

    return(
        <div className="mt-8 rounded-3xl border border-pink-300/20 bg-white/5 p-6">
        <div className="mb-6">
            <p className="text-sm text-pink-300">Phase 4 Test</p>
            <h2 className="mt-2 text-2xl font-bold">Client-Side Encryption Test</h2>
            <p className="mt-2 text-sm text-slate-400">
            This proves encryption and decryption happen in the browser before we
            store real vault data.
            </p>
        </div>

        <div className="grid gap-4">
            <label className="grid gap-2">
            <span className="text-sm text-slate-300">Master Password</span>
            <input
                type="password"
                value={masterPassword}
                onChange={(event) => setMasterPassword(event.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
                placeholder="Enter a test master password"
            />
            </label>

            <label className="grid gap-2">
            <span className="text-sm text-slate-300">Secret Text</span>
            <textarea
                value={secretText}
                onChange={(event) => setSecretText(event.target.value)}
                className="min-h-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-pink-300"
            />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
            <button
                type="button"
                onClick={handleEncrypt}
                className="rounded-full bg-pink-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-pink-300"
            >
                Encrypt
            </button>

            <button
                type="button"
                onClick={handleDecrypt}
                className="rounded-full border border-blue-300/40 px-5 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-300/10"
            >
                Decrypt
            </button>
            </div>

            {message && <p className="text-sm text-blue-200">{message}</p>}

            {encryptedText && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-slate-300">
                Ciphertext stored in database:
                </p>
                <p className="mt-2 break-all text-xs text-slate-400">
                {encryptedText}
                </p>
            </div>
            )}

            {decryptedText && (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-200">
                Decrypted in browser:
                </p>
                <p className="mt-2 text-sm text-emerald-100">{decryptedText}</p>
            </div>
            )}
        </div>
        </div>
    );

}