import type { UserResource } from "@clerk/nextjs/types";
import type { GetToken } from "@clerk/nextjs/types";
import { getFreshSupabaseToken } from "@/lib/clerk/getSupabaseToken";
import { createSupabaseBrowserClient } from "./client";

export async function ensureUserProfile({
  user,
  getToken,
}: {
  user: UserResource;
  getToken: GetToken;
}) {
  const clerkToken = await getFreshSupabaseToken(getToken);
  const supabase = createSupabaseBrowserClient(clerkToken);

  const email = user.primaryEmailAddress?.emailAddress ?? null;

  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: user.id,
      email,
      display_name: user.fullName ?? user.username ?? "B",
    })
    .select("*")
    .single();

  if (insertError) {
    throw insertError;
  }

  return newProfile;
}