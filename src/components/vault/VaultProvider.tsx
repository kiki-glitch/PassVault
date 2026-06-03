"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  base64ToUint8Array,
  deriveVaultKey,
} from "@/lib/crypto/vaultCrypto";

type UnlockVaultParams = {
  masterPassword: string;
  vaultSalt: string;
};

type VaultContextValue = {
  isUnlocked: boolean;
  vaultKey: CryptoKey | null;
  vaultSalt: string | null;
  unlockVault: (params: UnlockVaultParams) => Promise<void>;
  lockVault: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [vaultSalt, setVaultSalt] = useState<string | null>(null);

  async function unlockVault({ masterPassword, vaultSalt }: UnlockVaultParams) {
    if (!masterPassword.trim()) {
      throw new Error("Master password is required.");
    }

    if (!vaultSalt) {
      throw new Error("Vault salt is required.");
    }

    const saltBytes = base64ToUint8Array(vaultSalt);
    const key = await deriveVaultKey(masterPassword, saltBytes);

    setVaultKey(key);
    setVaultSalt(vaultSalt);
  }

  function lockVault() {
    setVaultKey(null);
  }

  const value = useMemo(
    () => ({
      isUnlocked: Boolean(vaultKey),
      vaultKey,
      vaultSalt,
      unlockVault,
      lockVault,
    }),
    [vaultKey, vaultSalt]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error("useVault must be used inside VaultProvider.");
  }

  return context;
}