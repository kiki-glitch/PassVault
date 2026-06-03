import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "../clerk/withSupabaseAuthRetry";
import type { EncryptedVaultItemInsert, VaultItemRow } from "@/types/vault";

export async function createVaultItem({
  getToken,
  item,
}: {
  getToken: GetToken;
  item: EncryptedVaultItemInsert;
}): Promise<VaultItemRow> {
  const { data, error } = await withSupabaseAuthRetry<VaultItemRow>(
    getToken,
    async (supabase) =>
      supabase.from("vault_items").insert(item).select("*").single()
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create vault item: No data returned.");
  }

  return data;
}

export async function getVaultItems({
  getToken,
  vaultId,
}: {
  getToken: GetToken;
  vaultId: string;
}): Promise<VaultItemRow[]> {
  const { data, error } = await withSupabaseAuthRetry<VaultItemRow[]>(
    getToken,
    async (supabase) =>
      supabase
        .from("vault_items")
        .select("*")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false })
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function deleteVaultItem({
  getToken,
  itemId,
}: {
  getToken: GetToken;
  itemId: string;
}): Promise<void> {
  const { error } = await withSupabaseAuthRetry<null>(
    getToken,
    async (supabase) =>
      supabase.from("vault_items").delete().eq("id", itemId)
  );

  if (error) {
    throw error;
  }
}