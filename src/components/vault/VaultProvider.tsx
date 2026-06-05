"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { base64ToUint8Array, deriveVaultKey } from "@/lib/crypto/vaultCrypto";

const AUTO_LOCK_DURATION_MS = 5 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;

type UnlockVaultParams = {
  masterPassword: string;
  vaultSalt: string;
};

type VaultContextValue = {
  isUnlocked: boolean;
  vaultKey: CryptoKey | null;
  vaultSalt: string | null;
  lastActivityAt: number | null;
  autoLockDurationMs: number;
  unlockVault: (params: UnlockVaultParams) => Promise<void>;
  lockVault: () => void;
  recordActivity: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [vaultSalt, setVaultSalt] = useState<string | null>(null);
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const lastRecordedActivityRef = useRef<number>(0);

  const isUnlocked = Boolean(vaultKey);

  const clearAutoLockTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const lockVault = useCallback(() => {
    clearAutoLockTimer();
    setVaultKey(null);
    setLastActivityAt(null);
  }, [clearAutoLockTimer]);

  const scheduleAutoLock = useCallback(() => {
    clearAutoLockTimer();

    timeoutRef.current = window.setTimeout(() => {
      lockVault();
    }, AUTO_LOCK_DURATION_MS);
  }, [clearAutoLockTimer, lockVault]);

  const recordActivity = useCallback(() => {
    if (!isUnlocked) return;

    const now = Date.now();

    if (now - lastRecordedActivityRef.current < ACTIVITY_THROTTLE_MS) {
      return;
    }

    lastRecordedActivityRef.current = now;
    setLastActivityAt(now);
    scheduleAutoLock();
  }, [isUnlocked, scheduleAutoLock]);

  const unlockVault = useCallback(
    async ({ masterPassword, vaultSalt }: UnlockVaultParams) => {
      if (!masterPassword.trim()) {
        throw new Error("Master password is required.");
      }

      if (!vaultSalt) {
        throw new Error("Vault salt is required.");
      }

      const saltBytes = base64ToUint8Array(vaultSalt);
      const key = await deriveVaultKey(masterPassword, saltBytes);

      const now = Date.now();

      setVaultKey(key);
      setVaultSalt(vaultSalt);
      setLastActivityAt(now);
      lastRecordedActivityRef.current = now;
    },
    []
  );

  useEffect(() => {
    if (!isUnlocked) {
      clearAutoLockTimer();
      return;
    }

    scheduleAutoLock();

    return () => {
      clearAutoLockTimer();
    };
  }, [isUnlocked, scheduleAutoLock, clearAutoLockTimer]);

  useEffect(() => {
    if (!isUnlocked) return;

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "pointermove",
    ];

    function handleActivity() {
      recordActivity();
    }

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [isUnlocked, recordActivity]);

  useEffect(() => {
    if (!isUnlocked) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        lockVault();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isUnlocked, lockVault]);

  const value = useMemo(
    () => ({
      isUnlocked,
      vaultKey,
      vaultSalt,
      lastActivityAt,
      autoLockDurationMs: AUTO_LOCK_DURATION_MS,
      unlockVault,
      lockVault,
      recordActivity,
    }),
    [
      isUnlocked,
      vaultKey,
      vaultSalt,
      lastActivityAt,
      unlockVault,
      lockVault,
      recordActivity,
    ]
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