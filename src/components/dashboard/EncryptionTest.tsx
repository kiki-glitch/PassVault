"use client";

import { useState } from "react";
import { decryptText, encryptText } from "@/lib/crypto/vaultCrypto";
import { useVault } from "@/components/vault/VaultProvider";

export function EncryptionTest() {
  const { isUnlocked, vaultKey } = useVault();

  const [secretText, setSecretText] = useState("Netflix password: Demo123!");
  const [encryptedText, setEncryptedText] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [ivBase64, setIvBase64] = useState("");
  const [message, setMessage] = useState("");

  async function handleEncrypt() {
    try {
      if (!isUnlocked || !vaultKey) {
        setMessage("Unlock the vault first.");
        return;
      }

      if (!secretText) {
        setMessage("Enter secret text first.");
        return;
      }

      const encrypted = await encryptText(secretText, vaultKey);

      setIvBase64(encrypted.iv);
      setEncryptedText(encrypted.ciphertext);
      setDecryptedText("");
      setMessage("Encrypted successfully using the unlocked vault key.");
    } catch (error) {
      console.error(error);
      setMessage("Encryption failed. Check console.");
    }
  }

  async function handleDecrypt() {
    try {
      if (!isUnlocked || !vaultKey) {
        setMessage("Unlock the vault first.");
        return;
      }

      if (!encryptedText || !ivBase64) {
        setMessage("Encrypt something first, then try decrypting.");
        return;
      }

      const decrypted = await decryptText({
        ciphertext: encryptedText,
        iv: ivBase64,
        key: vaultKey,
      });

      setDecryptedText(decrypted);
      setMessage("Decrypted successfully using the unlocked vault key.");
    } catch (error) {
      console.error(error);
      setDecryptedText("");
      setMessage("Decryption failed. Wrong key or corrupted ciphertext.");
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-pink-300/20 bg-white/5 p-6">
      <div className="mb-6">
        <p className="text-sm text-pink-300">Phase 5 Test</p>
        <h2 className="mt-2 text-2xl font-bold">Vault Key Encryption Test</h2>
        <p className="mt-2 text-sm text-slate-400">
          This now uses the vault key from memory after unlocking.
        </p>
      </div>

      <div className="grid gap-4">
        {!isUnlocked && (
          <div className="rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
            <p className="text-sm text-yellow-100">
              Unlock the vault above before testing encryption.
            </p>
          </div>
        )}

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