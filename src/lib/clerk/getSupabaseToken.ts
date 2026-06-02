// import type { GetToken } from "@clerk/nextjs/types";
// import { decodeJwtPayload } from "./debugToken";

// export async function getFreshSupabaseToken(getToken: GetToken) {
//   const token = await getToken({
//     // template: "supabase",
//     skipCache: true,
//   });

//   if (!token) {
//     throw new Error("Could not retrieve Clerk Supabase token.");
//   }

//   const payload = decodeJwtPayload(token);

//   console.log("Supabase template token debug:", {
//     sub: payload.sub,
//     role: payload.role,
//     aud: payload.aud,
//     exp: payload.exp,
//     now: Math.floor(Date.now() / 1000),
//     secondsUntilExpiry: payload.exp - Math.floor(Date.now() / 1000),
//   });

//   return token;
// }

import type { GetToken } from "@clerk/nextjs/types";

function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("Invalid JWT format.");
  }

  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(window.atob(base64));
}

export async function getFreshSupabaseToken(getToken: GetToken) {
  const token = await getToken({
    skipCache: true,
  });

  if (!token) {
    throw new Error("Could not retrieve Clerk token for Supabase.");
  }

  const payload = decodeJwtPayload(token);

  console.log("Supabase auth token debug:", {
    sub: payload.sub,
    iss: payload.iss,
    aud: payload.aud,
    exp: payload.exp,
    now: Math.floor(Date.now() / 1000),
    secondsUntilExpiry: payload.exp - Math.floor(Date.now() / 1000),
  });

  return token;
}