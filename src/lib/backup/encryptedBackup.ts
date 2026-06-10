import type {
  EncryptedBackupSecureNote,
  EncryptedBackupVaultItem,
  EncryptedVaultBackup,
  SecureNoteRow,
  VaultItemRow,
} from "@/types/vault";

export function createEncryptedBackup({
  vaultItems,
  secureNotes,
}: {
  vaultItems: VaultItemRow[];
  secureNotes: SecureNoteRow[];
}): EncryptedVaultBackup {
  return {
    app: "B_MEMORY_VAULT",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      vaultItems: vaultItems.map(stripVaultItemForBackup),
      secureNotes: secureNotes.map(stripSecureNoteForBackup),
    },
  };
}

function stripVaultItemForBackup(
  item: VaultItemRow
): EncryptedBackupVaultItem {
  const { id, created_at, updated_at, ...backupItem } = item;
  return backupItem;
}

function stripSecureNoteForBackup(
  note: SecureNoteRow
): EncryptedBackupSecureNote {
  const { id, created_at, updated_at, ...backupNote } = note;
  return backupNote;
}

export function downloadEncryptedBackup(backup: EncryptedVaultBackup) {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `b-memory-vault-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export function parseEncryptedBackup(rawText: string): EncryptedVaultBackup {
  const parsed = JSON.parse(rawText) as unknown;

  if (!isEncryptedVaultBackup(parsed)) {
    throw new Error("Invalid backup file.");
  }

  return parsed;
}

function isEncryptedVaultBackup(value: unknown): value is EncryptedVaultBackup {
  if (!value || typeof value !== "object") {
    return false;
  }

  const backup = value as Partial<EncryptedVaultBackup>;

  return (
    backup.app === "B_MEMORY_VAULT" &&
    backup.version === 1 &&
    typeof backup.exportedAt === "string" &&
    Array.isArray(backup.data?.vaultItems) &&
    Array.isArray(backup.data?.secureNotes)
  );
}