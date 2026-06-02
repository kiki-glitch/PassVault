import type { GetToken } from "@clerk/nextjs/types";
import { getFreshSupabaseToken } from "@/lib/clerk/getSupabaseToken";
import { createSupabaseBrowserClient } from "./client";

async function createAuthedSupabaseClient(getToken: GetToken) {
  const clerkToken = await getFreshSupabaseToken(getToken);
  return createSupabaseBrowserClient(clerkToken);
}

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
  const supabase = await createAuthedSupabaseClient(getToken);

  const { data, error } = await supabase
    .from("vaults")
    .insert({
      owner_id: profileId,
      name,
      description,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getVaults(getToken: GetToken) {
  const supabase = await createAuthedSupabaseClient(getToken);

  const { data, error } = await supabase
    .from("vaults")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}