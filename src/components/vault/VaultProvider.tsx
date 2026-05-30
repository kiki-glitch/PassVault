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
  generateSalt,
  arrayBuffertoBase64,
} from "@/lib/crypto/vaultCrypto";

type VaultContextValue = {
  isUnlocked: boolean;
  vaultKey: CryptoKey | null;
  vaultSalt: string | null;
  unlockVault: (masterPassword: string) => Promise<void>;
  lockVault: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({children}: { children:ReactNode}){
    const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
    const [vaultSalt, setVaultSalt] = useState<string | null>(null);

    async function unlockVault(masterPassword:string){
        if(!masterPassword.trim()){
            throw new Error("Master password is required.")
        }

        /**
         * TEMPORARY MVP BEHAVIOR:
         * If no salt exists yet, generate one.
         *
         * Later, we will store the user's vault salt in Supabase
         * because the same salt must be reused to derive the same key.
         */

        const salt = vaultSalt
            ? base64ToUint8Array(vaultSalt)
            : generateSalt();
        
        const key = await deriveVaultKey(masterPassword, salt);

        setVaultKey(key);
        setVaultSalt(arrayBuffertoBase64(salt));
    }

    function lockVault(){
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

    if(!context){
        throw new Error("useVault must be used inside VaultProvider.");
    }

    return context;
}