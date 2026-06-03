import type { GetToken, UserResource } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "./withSupabaseAuthRetry";

export type ProfileRow = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
  vault_salt: string | null;
  created_at: string;
  updated_at: string;
};

export async function ensureUserProfile({
  user,
  getToken,
}: {
  user: UserResource;
  getToken: GetToken;
}): Promise<ProfileRow> {
  const email = user.primaryEmailAddress?.emailAddress ?? null;

  const { data: existingProfile, error: selectError } =
    await withSupabaseAuthRetry<ProfileRow>(getToken, async (supabase) =>
      supabase
        .from("profiles")
        .select("*")
        .eq("clerk_user_id", user.id)
        .maybeSingle()
    );

  if (selectError) {
    throw selectError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data: newProfile, error: insertError } =
    await withSupabaseAuthRetry<ProfileRow>(getToken, async (supabase) =>
      supabase
        .from("profiles")
        .insert({
          clerk_user_id: user.id,
          email,
          display_name: user.fullName ?? user.username ?? "B",
        })
        .select("*")
        .single()
    );

  if (insertError) {
    throw insertError;
  }

  if (!newProfile) {
    throw new Error("Failed to create profile: No data returned.");
  }

  return newProfile;
}

export async function updateUserVaultSalt({
  profileId,
  vaultSalt,
  getToken,
}: {
  profileId: string;
  vaultSalt: string;
  getToken: GetToken;
}): Promise<ProfileRow> {
  const { data, error } = await withSupabaseAuthRetry<ProfileRow>(
    getToken,
    async (supabase) =>
      supabase
        .from("profiles")
        .update({
          vault_salt: vaultSalt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
        .select("*")
        .single()
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update vault salt: No data returned.");
  }

  return data;
}