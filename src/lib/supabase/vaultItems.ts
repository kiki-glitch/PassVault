import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "../clerk/withSupabaseAuthRetry";
import type { EncryptedVaultItemInsert, VaultItemRow } from "@/types/vault";

export async function createVaultItem({
  getToken,
  item,
}: {
  getToken: GetToken;
  item: EncryptedVaultItemInsert;
}) {
  const { data, error } = await withSupabaseAuthRetry(getToken, async (supabase) =>
    await supabase.from("vault_items").insert(item).select("*").single()
  );

  if (error) {
    throw error;
  }

  // Safe guard clause: ensures data exists before casting
  if (!data) {
    throw new Error("Failed to create vault item: No data returned.");
  }

  return data as VaultItemRow;
}

export async function getVaultItems({
  getToken,
  vaultId,
}: {
  getToken: GetToken;
  vaultId: string;
}) {
  const { data, error } = await withSupabaseAuthRetry(getToken, async (supabase) =>
    await supabase
      .from("vault_items")
      .select("*")
      .eq("vault_id", vaultId)
      .order("created_at", { ascending: false })
  );

  if (error) {
    throw error;
  }

  // TypeScript allows casting arrays safely because of the fallback array
  return (data ?? []) as VaultItemRow[];
}

export async function deleteVaultItem({
  getToken,
  itemId,
}: {
  getToken: GetToken;
  itemId: string;
}) {
  const { error } = await withSupabaseAuthRetry(getToken, async (supabase) =>
    await supabase.from("vault_items").delete().eq("id", itemId)
  );

  if (error) {
    throw error;
  }
}
