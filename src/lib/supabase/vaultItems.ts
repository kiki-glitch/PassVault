import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "./withSupabaseAuthRetry";
import type {EncryptedBackupVaultItem, EncryptedVaultItemInsert, EncryptedVaultItemUpdate ,VaultItemRow } from "@/types/vault";

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

export async function updateVaultItem({
  getToken,
  itemId,
  item,
}: {
  getToken: GetToken;
  itemId: string;
  item: EncryptedVaultItemUpdate;
}): Promise<VaultItemRow> {
  const { data, error } = await withSupabaseAuthRetry<VaultItemRow>(
    getToken,
    async (supabase) =>
      supabase
        .from("vault_items")
        .update(item)
        .eq("id", itemId)
        .select("*")
        .single()
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update vault item: No data returned.");
  }

  return data;
}

export async function importVaultItems({
  getToken,
  items,
}: {
  getToken: GetToken;
  items: EncryptedBackupVaultItem[];
}): Promise<VaultItemRow[]> {
  if (items.length === 0) {
    return [];
  }

  const { data, error } = await withSupabaseAuthRetry<VaultItemRow[]>(
    getToken,
    async (supabase) =>
      supabase.from("vault_items").insert(items).select("*")
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}