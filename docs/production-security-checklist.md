# B’s Memory Vault - Production Security Checklist

## Authentication

- [ ] Clerk production instance is configured.
- [ ] Production Clerk publishable key uses `pk_live_`.
- [ ] Production Clerk secret key is set only in deployment environment variables.
- [ ] `/dashboard` is protected.
- [ ] `/sign-in` and `/sign-up` are public.
- [ ] Clerk UserProfile uses hash routing inside dashboard.

## Supabase

- [ ] Supabase production project is configured.
- [ ] RLS is enabled on all public tables.
- [ ] Policies exist for profiles.
- [ ] Policies exist for vaults.
- [ ] Policies exist for vault_items.
- [ ] Policies exist for secure_notes.
- [ ] No broad public read/write policies exist.
- [ ] `get_current_profile_id()` is stable and security definer.
- [ ] Clerk third-party auth integration is enabled in Supabase.
- [ ] Supabase anon key only is exposed to client.
- [ ] Supabase service role key is not used in frontend code.

## Zero-Knowledge Vault

- [ ] Master password is never sent to server.
- [ ] Master password is never saved in localStorage/sessionStorage.
- [ ] Vault key is stored only in React/browser memory.
- [ ] Refresh locks the vault.
- [ ] Auto-lock works.
- [ ] Tab visibility lock works if enabled.
- [ ] Clipboard/reveal cleanup works.
- [ ] Wrong master password cannot decrypt existing data.

## Database Content

- [ ] `vault_items` contains ciphertext only.
- [ ] `secure_notes` contains ciphertext only.
- [ ] No plaintext passwords are stored.
- [ ] No plaintext note content is stored.
- [ ] Backup export contains encrypted data only.

## Deployment

- [ ] Environment variables are configured in Vercel.
- [ ] `.env.local` is not committed.
- [ ] Production app uses HTTPS.
- [ ] Build passes.
- [ ] No dev test components are visible.
- [ ] No sensitive console logs exist.

## Manual Attack Test

- [ ] Inspect network requests during create/edit.
- [ ] Confirm payloads contain ciphertext only.
- [ ] Try accessing dashboard while logged out.
- [ ] Try accessing another user's rows if possible.
- [ ] Refresh page and confirm vault locks.
- [ ] Export backup and confirm no readable secrets.