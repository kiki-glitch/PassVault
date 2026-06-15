"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  createEncryptedBackup,
  downloadEncryptedBackup,
  parseEncryptedBackup,
} from "@/lib/backup/encryptedBackup";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { getSecureNotes, importSecureNotes } from "@/lib/supabase/secureNotes";
import { getVaultItems, importVaultItems } from "@/lib/supabase/vaultItems";
import { createVault, getVaults } from "@/lib/supabase/vaults";
import type {
  EncryptedBackupSecureNote,
  EncryptedBackupVaultItem,
} from "@/types/vault";

export function BackupSettingsPanel() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  async function getOrCreateDefaultVault(profileId: string) {
    const vaults = await getVaults(getToken);

    if (vaults.length > 0) {
      return vaults[0];
    }

    return createVault({
      profileId,
      getToken,
      name: "B's Main Vault",
      description: "Default vault for imported saved keys and little notes.",
    });
  }

  async function handleExport() {
    if (!user) {
      setMessage("You must be signed in to export a backup.");
      return;
    }

    const confirmed = window.confirm(
      "This will download an encrypted backup file. Keep it safe. Anyone with this file and your master password may be able to restore your vault."
    );

    if (!confirmed) return;

    try {
      setIsExporting(true);
      setMessage("Preparing encrypted backup...");

      const vaults = await getVaults(getToken);

      if (vaults.length === 0) {
        setMessage("No vault found yet. Add saved keys or notes first.");
        return;
      }

      const vault = vaults[0];

      const [vaultItems, secureNotes] = await Promise.all([
        getVaultItems({
          getToken,
          vaultId: vault.id,
        }),
        getSecureNotes({
          getToken,
          vaultId: vault.id,
        }),
      ]);

      const backup = createEncryptedBackup({
        vaultItems,
        secureNotes,
      });

      downloadEncryptedBackup(backup);

      setMessage(
        `Encrypted backup exported. Items: ${vaultItems.length}, Notes: ${secureNotes.length}.`
      );
    } catch (error) {
      console.error("Export backup failed:", error);
      setMessage("Could not export backup. Check console.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmed = window.confirm(
      "Importing creates new encrypted records in your current vault. Continue?"
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    if (!user) {
      setMessage("You must be signed in to import a backup.");
      event.target.value = "";
      return;
    }

    try {
      setIsImporting(true);
      setMessage("Reading backup file...");

      const rawText = await file.text();
      const backup = parseEncryptedBackup(rawText);

      const profile = await ensureUserProfile({
        user,
        getToken,
      });

      const vault = await getOrCreateDefaultVault(profile.id);

      const preparedVaultItems: EncryptedBackupVaultItem[] =
        backup.data.vaultItems.map((item) => ({
          ...item,
          owner_id: profile.id,
          vault_id: vault.id,
        }));

      const preparedSecureNotes: EncryptedBackupSecureNote[] =
        backup.data.secureNotes.map((note) => ({
          ...note,
          owner_id: profile.id,
          vault_id: vault.id,
        }));

      const [importedItems, importedNotes] = await Promise.all([
        importVaultItems({
          getToken,
          items: preparedVaultItems,
        }),
        importSecureNotes({
          getToken,
          notes: preparedSecureNotes,
        }),
      ]);

      setMessage(
        `Import complete. Saved keys: ${importedItems.length}, Notes: ${importedNotes.length}.`
      );
    } catch (error) {
      console.error("Import backup failed:", error);
      setMessage("Could not import backup. Make sure the file is valid.");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  }

  return (
    <section className="rounded-vault-panel border border-vault-border bg-vault-card p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          Encrypted Backup
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Import / export vault backup
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-vault-text-muted">
          Export and import encrypted saved keys and notes. Backup files contain
          ciphertext, not readable passwords or note content.
        </p>
      </div>

      <div className="mt-5 rounded-vault-card border border-yellow-300/20 bg-yellow-500/10 p-4">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
          Keep backups private.
        </p>
        <p className="mt-2 text-sm leading-6 text-yellow-900/80 dark:text-yellow-100/80">
          The backup is encrypted, but someone with both this file and the vault
          master password may be able to restore the vault.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || isImporting}
          className="rounded-vault-input bg-vault-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Exporting..." : "Export Encrypted Backup"}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isExporting || isImporting}
          className="rounded-vault-input border border-vault-border px-5 py-3 text-sm font-semibold text-vault-text-muted transition hover:bg-vault-overlay/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isImporting ? "Importing..." : "Import Encrypted Backup"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFileChange}
          className="hidden"
        />
      </div>

      {message && <p className="mt-4 text-sm text-vault-text-muted">{message}</p>}
    </section>
  );
}
