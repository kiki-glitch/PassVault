import type { GetToken } from "@clerk/nextjs/types";
import { getFreshSupabaseToken } from "@/lib/clerk/getSupabaseToken";
import { createSupabaseBrowserClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";


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
  let token = await getFreshSupabaseToken(getToken);
  let supabase = createSupabaseBrowserClient(token);

  let result = await action(supabase);

  if (!isJwtAuthError(result.error)) {
    return result;
  }

  token = await getFreshSupabaseToken(getToken);
  supabase = createSupabaseBrowserClient(token);

  result = await action(supabase);

  return result;
}