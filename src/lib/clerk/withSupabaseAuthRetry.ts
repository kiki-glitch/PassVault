import type { GetToken } from "@clerk/nextjs/types";
import { getFreshSupabaseToken } from "@/lib/clerk/getSupabaseToken";
import { createSupabaseBrowserClient } from "../supabase/client";

type SupabaseError = {
  code?: string;
  message?: string;
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
  action: (supabase: ReturnType<typeof createSupabaseBrowserClient>) => Promise<{
    data: T | null;
    error: SupabaseError | null;
  }>
) {
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