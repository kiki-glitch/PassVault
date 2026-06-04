import type { GetToken } from "@clerk/nextjs/types";
import { withSupabaseAuthRetry } from "./withSupabaseAuthRetry";
import type {
  EncryptedSecureNoteInsert,
  EncryptedSecureNoteUpdate,
  SecureNoteRow,
} from "@/types/vault";

export async function createSecureNote({
  getToken,
  note,
}: {
  getToken: GetToken;
  note: EncryptedSecureNoteInsert;
}): Promise<SecureNoteRow> {
  const { data, error } = await withSupabaseAuthRetry<SecureNoteRow>(
    getToken,
    async (supabase) =>
      supabase.from("secure_notes").insert(note).select("*").single()
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create secure note: No data returned.");
  }

  return data;
}

export async function getSecureNotes({
  getToken,
  vaultId,
}: {
  getToken: GetToken;
  vaultId?: string;
}): Promise<SecureNoteRow[]> {
  const { data, error } = await withSupabaseAuthRetry<SecureNoteRow[]>(
    getToken,
    async (supabase) => {
      let query = supabase
        .from("secure_notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (vaultId) {
        query = query.eq("vault_id", vaultId);
      }

      return query;
    }
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateSecureNote({
  getToken,
  noteId,
  note,
}: {
  getToken: GetToken;
  noteId: string;
  note: EncryptedSecureNoteUpdate;
}): Promise<SecureNoteRow> {
  const { data, error } = await withSupabaseAuthRetry<SecureNoteRow>(
    getToken,
    async (supabase) =>
      supabase
        .from("secure_notes")
        .update(note)
        .eq("id", noteId)
        .select("*")
        .single()
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update secure note: No data returned.");
  }

  return data;
}

export async function deleteSecureNote({
  getToken,
  noteId,
}: {
  getToken: GetToken;
  noteId: string;
}): Promise<void> {
  const { error } = await withSupabaseAuthRetry<null>(
    getToken,
    async (supabase) =>
      supabase.from("secure_notes").delete().eq("id", noteId)
  );

  if (error) {
    throw error;
  }
}