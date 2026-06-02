import type { GetToken } from "@clerk/nextjs/types";

export async function getFreshSupabaseToken(getToken: GetToken) {
  const token = await getToken({
    skipCache: true,
  });

  if (!token) {
    throw new Error("Could not retrieve Clerk token for Supabase.");
  }

  return token;
}