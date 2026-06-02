import type { GetToken } from "@clerk/nextjs/types";
import { decodeJwtPayload } from "./debugToken";

export async function getFreshSupabaseToken(getToken: GetToken) {
  const token = await getToken({
    skipCache: true,
  });

  if (!token) {
    throw new Error("Could not retrieve Clerk token for Supabase.");
  }

  const payload = decodeJwtPayload(token);

  console.log("Clerk token debug:", {
    sub: payload.sub,
    iss: payload.iss,
    aud: payload.aud,
    iat: payload.iat,
    exp: payload.exp,
    now: Math.floor(Date.now() / 1000),
    secondsUntilExpiry: payload.exp - Math.floor(Date.now() / 1000),
  });

  return token;
}