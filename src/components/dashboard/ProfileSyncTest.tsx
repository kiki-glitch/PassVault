"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { createVault, getVaults } from "@/lib/supabase/vaults";

type TestStatus = "idle" | "loading" | "success" | "error";

type Vault = {
  id: string;
  name: string;
  description: string | null;
};

export function ProfileSyncTest() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [status, setStatus] = useState<TestStatus>("idle");
  const [message, setMessage] = useState("Database test not started.");
  const [vaults, setVaults] = useState<Vault[]>([]);

  async function handleCreateTestVault() {
    if (!user) return;

    try {
      setStatus("loading");
      setMessage("Creating test vault...");

      const clerkToken = await getToken();

      if (!clerkToken) {
        throw new Error("Could not retrieve Clerk token.");
      }

      const profile = await ensureUserProfile({
        user,
        clerkToken,
      });

      await createVault({
        profileId: profile.id,
        clerkToken,
        name: "B’s First Vault",
        description: "A test vault created from the dashboard.",
      });

      const updatedVaults = await getVaults(clerkToken);

      setVaults(updatedVaults);
      setStatus("success");
      setMessage("Test vault created successfully.");
    } catch (error) {
      console.error("Create test vault failed:", error);
      setStatus("error");
      setMessage("Test vault creation failed. Check console and RLS policies.");
    }
  }

  useEffect(() => {
    async function syncProfileAndLoadVaults() {
      if (!isLoaded || !user) return;

      try {
        setStatus("loading");
        setMessage("Syncing profile and loading vaults...");

        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("Could not retrieve Clerk token.");
        }

        const profile = await ensureUserProfile({
          user,
          clerkToken,
        });

        const existingVaults = await getVaults(clerkToken);

        setVaults(existingVaults);
        setStatus("success");
        setMessage(`Profile synced: ${profile.email ?? profile.clerk_user_id}`);
      } catch (error) {
        console.error("Database test failed:", error);
        setStatus("error");
        setMessage("Database test failed. Check console, Clerk token, and RLS.");
      }
    }

    syncProfileAndLoadVaults();
  }, [isLoaded, user, getToken]);

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-400">Supabase Database Test</p>

          <p
            className={`mt-2 font-medium ${
              status === "success"
                ? "text-emerald-300"
                : status === "error"
                  ? "text-red-300"
                  : "text-blue-300"
            }`}
          >
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateTestVault}
          className="rounded-full bg-pink-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-pink-300"
        >
          Create Test Vault
        </button>
      </div>

      {vaults.length > 0 && (
        <div className="mt-6 space-y-3">
          {vaults.map((vault) => (
            <div
              key={vault.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <p className="font-medium text-white">{vault.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {vault.description ?? "No description"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}