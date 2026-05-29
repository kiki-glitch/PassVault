"use client"

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ensureUserProfile } from "@/lib/supabase/profile";

type ProfileStatus = "idle" | "loading" | "success" | "error";

export function ProfileSyncTest() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [status, setStatus] = useState<ProfileStatus>("idle");
  const [message, setMessage] = useState("Profile sync not started.");

  useEffect(() => {
    async function syncProfile() {
      if (!isLoaded || !user) return;

      try {
        setStatus("loading");
        setMessage("Syncing Clerk user with Supabase profile...");

        const clerkToken = await getToken();

        if (!clerkToken) {
          throw new Error("Could not retrieve Clerk token.");
        }

        const profile = await ensureUserProfile({
          user,
          clerkToken,
        });

        setStatus("success");
        setMessage(`Profile synced: ${profile.email ?? profile.clerk_user_id}`);
      } catch (error) {
        console.error("Profile sync failed:", error);
        setStatus("error");
        setMessage("Profile sync failed. Check console, Clerk token, and RLS.");
      }
    }

    syncProfile();
  }, [isLoaded, user, getToken]);

  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-slate-400">Supabase Connection Test</p>

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
);

}