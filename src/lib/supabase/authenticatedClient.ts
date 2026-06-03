import type { GetToken } from "@clerk/nextjs/types";
import { createClient } from "@supabase/supabase-js";

export function createAuthenticatedSupabaseClient(getToken: GetToken) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      const token = await getToken({
        skipCache: true,
      });

      if (!token) {
        return null;
      }

      return token;
    },
  });
}