import { createSupabaseBrowserClient } from "./client";

type CreateVaultParams = {
  profileId: string;
  clerkToken: string;
  name: string;
  description?: string;
};

export async function createVault({
  profileId,
  clerkToken,
  name,
  description,
}: CreateVaultParams) {
  const supabase = createSupabaseBrowserClient(clerkToken);

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

export async function getVaults(clerkToken: string) {
  const supabase = createSupabaseBrowserClient(clerkToken);

  const { data, error } = await supabase
    .from("vaults")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}