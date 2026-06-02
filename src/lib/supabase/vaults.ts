import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "../clerk/withSupabaseAuthRetry";

export async function createVault({
  profileId,
  getToken,
  name,
  description,
}: {
  profileId: string;
  getToken: GetToken;
  name: string;
  description?: string;
}) {
  // Added async/await inside the callback wrapper
  const { data, error } = await withSupabaseAuthRetry(getToken, async (supabase) => 
    await supabase
      .from("vaults")
      .insert({
        owner_id: profileId,
        name,
        description,
      })
      .select("*")
      .single()
  );

  if (error) {
    throw error;
  }
  return data;
}

export async function getVaults(getToken: GetToken) {
  // Added async/await inside the callback wrapper
  const { data, error } = await withSupabaseAuthRetry(getToken, async (supabase) =>
    await supabase
      .from("vaults")
      .select("*")
      .order("created_at", { ascending: false })
  );

  if (error) {
    throw error;
  }
  return data ?? [];
}
