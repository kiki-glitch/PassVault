import type { GetToken, UserResource } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "../clerk/withSupabaseAuthRetry";

export async function ensureUserProfile({
  user,
  getToken,
}: {
  user: UserResource;
  getToken: GetToken;
}) {
  const email = user.primaryEmailAddress?.emailAddress ?? null;

  // Added async/await to the select query wrapper
  const { data: existingProfile, error: selectError } =
    await withSupabaseAuthRetry(getToken, async (supabase) =>
      await supabase
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

  // Added async/await to the insert query wrapper
  const { data: newProfile, error: insertError } =
    await withSupabaseAuthRetry(getToken, async (supabase) =>
      await supabase
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

  return newProfile;
}
