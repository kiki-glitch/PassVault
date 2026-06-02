import type { GetToken } from "@clerk/nextjs/types";
import { decodeJwtPayload } from "./debugToken";

export async function getFreshSupabaseToken(getToken: GetToken) {
  const token = await getToken({
    template: "supabase",
    skipCache: true,
  });

  if (!token) {
    throw new Error("Could not retrieve Clerk Supabase token.");
  }

  const payload = decodeJwtPayload(token);

  console.log("Supabase template token debug:", {
    sub: payload.sub,
    role: payload.role,
    aud: payload.aud,
    exp: payload.exp,
    now: Math.floor(Date.now() / 1000),
    secondsUntilExpiry: payload.exp - Math.floor(Date.now() / 1000),
  });

  return token;
}