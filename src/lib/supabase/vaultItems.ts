import { createSupabaseBrowserClient } from "./client";
import type { EncryptedVaultItemInsert, VaultItemRow } from "@/types/vault";

type CreateVaultItemParams = {
  clerkToken: string;
  item: EncryptedVaultItemInsert;
};

export async function createVaultItem({
    clerkToken,
    item,
}: CreateVaultItemParams) {
    const supabase = createSupabaseBrowserClient(clerkToken)

    const { data, error} = await supabase
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
    clerkToken,
    vaultId,
}:{
    clerkToken: string;
    vaultId: string;
}){
    const supabse = createSupabaseBrowserClient(clerkToken)

    const {data, error} = await supabse
        .from("vault_items")
        .select("*")
        .eq("vault_id", vaultId)
        .order("created_at", { ascending: false})

    if (error){
        throw error;
    }

    return data as VaultItemRow[];

}

export async function deleteVaultItem({
    clerkToken,
    itemId,
}: {
    clerkToken: string;
    itemId:string;
}) {
    const supabase = createSupabaseBrowserClient(clerkToken)

    const {error} = await supabase.from("vault_items").delete().eq("id", itemId);

    if (error){
        throw error;
    }
}