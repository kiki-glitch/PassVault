import type { GetToken } from "@clerk/nextjs/types";
import { getFreshSupabaseToken } from "@/lib/clerk/getSupabaseToken";
import { createSupabaseBrowserClient } from "./client";
import type { EncryptedVaultItemInsert, VaultItemRow } from "@/types/vault";

async function createAuthedSupabaseClient(getToken: GetToken) {
  const clerkToken = await getFreshSupabaseToken(getToken);
  return createSupabaseBrowserClient(clerkToken);
}

export async function createVaultItem({
  getToken,
  item,
}: {
  getToken: GetToken;
  item: EncryptedVaultItemInsert;
}) {
  const supabase = await createAuthedSupabaseClient(getToken);

  const { data, error } = await supabase
    .from("vault_items")
    .insert(item)
    .select("*")
    .single();

  if (error) {
    throw error;
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
  const supabase = await createAuthedSupabaseClient(getToken);

  const { data, error } = await supabase
    .from("vault_items")
    .select("*")
    .eq("vault_id", vaultId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as VaultItemRow[];
}

export async function deleteVaultItem({
  getToken,
  itemId,
}: {
  getToken: GetToken;
  itemId: string;
}) {
  const supabase = await createAuthedSupabaseClient(getToken);

  const { error } = await supabase.from("vault_items").delete().eq("id", itemId);

  if (error) {
    throw error;
  }
}