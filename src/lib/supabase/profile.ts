import type { UserResource } from "@clerk/nextjs/types";
import { createSupabaseBrowserClient } from "./client";

type EnsureProfileParams = {
  user: UserResource;
  clerkToken: string;
};

export async function ensureUserProfile({
    user,
    clerkToken
}: EnsureProfileParams){

    const supabase = createSupabaseBrowserClient(clerkToken);

    const email = user.primaryEmailAddress?.emailAddress ?? null;

    const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", user.id)
    .maybeSingle();

     if (selectError) {
        throw selectError;
    }

    if (existingProfile) {
        return existingProfile;
    }

    const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
            clerk_user_id: user.id,
            email,
            display_name: user.fullName ?? user.username ?? "B",
        })
        .select("*")
        .single();
    
    if(insertError){
        throw insertError;
    }

    return newProfile;
}
