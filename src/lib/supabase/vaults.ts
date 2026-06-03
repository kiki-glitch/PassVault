import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "./withSupabaseAuthRetry";

export type VaultRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

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
}): Promise<VaultRow> {
  const { data, error } = await withSupabaseAuthRetry<VaultRow>(
    getToken,
    async (supabase) =>
      supabase
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

  if (!data) {
    throw new Error("Failed to create vault: No data returned.");
  }

  return data;
}

export async function getVaults(getToken: GetToken): Promise<VaultRow[]> {
  const { data, error } = await withSupabaseAuthRetry<VaultRow[]>(
    getToken,
    async (supabase) =>
      supabase
        .from("vaults")
        .select("*")
        .order("created_at", { ascending: false })
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}
