import type { GetToken } from "@clerk/nextjs/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAuthenticatedSupabaseClient } from "./authenticatedClient";

type SupabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

type SupabaseResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};

function isJwtAuthError(error: SupabaseError | null | undefined) {
  return (
    error?.code === "PGRST301" ||
    error?.code === "PGRST303" ||
    error?.message?.toLowerCase().includes("jwt")
  );
}

export async function withSupabaseAuthRetry<T>(
  getToken: GetToken,
  action: (supabase: SupabaseClient) => Promise<SupabaseResult<T>>
): Promise<SupabaseResult<T>> {
  const firstClient = createAuthenticatedSupabaseClient(getToken);
  const firstResult = await action(firstClient);

  if (!isJwtAuthError(firstResult.error)) {
    return firstResult;
  }

  const secondClient = createAuthenticatedSupabaseClient(getToken);
  return action(secondClient);
}