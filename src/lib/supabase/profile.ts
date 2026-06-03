import type { GetToken, UserResource } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "../clerk/withSupabaseAuthRetry";

export type ProfileRow = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
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