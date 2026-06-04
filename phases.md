Phase 0: Project Planning & Security Rules
Goal

Understand what the app must and must not do.

Key rule

The server/database must never see plain passwords.

User enters password
→ Browser encrypts it
→ Supabase stores encrypted text only
Deliverables
Final app name: B’s Memory Vault
Confirm stack:
Next.js App Router
TypeScript
Tailwind CSS
Supabase PostgreSQL
Clerk Auth
Stripe later
Basic security rules document
Testing

Before coding, confirm:

You know what data is encrypted
You know what data is safe to store normally
You know what Clerk handles vs what your app handles


Phase 1: Next.js Project Setup
Goal

Create the base app.

What you learn
Next.js App Router
Project structure
Routing
Tailwind setup
Environment variables
Deliverables
/               landing page
/sign-in        Clerk sign in
/sign-up        Clerk sign up
/dashboard      protected dashboard
Testing

Check:

App runs locally
Tailwind works
Routes load correctly
Protected pages redirect if logged out

Phase 2: Clerk Authentication
Goal

Add login, signup, session handling, and protected routes.

What you learn
Clerk provider
Middleware
Authenticated layouts
User session handling
Deliverables
Clerk login
Clerk signup
protected dashboard
user profile button
logout
Testing

Test:

Logged-out user cannot access dashboard
Logged-in user can access dashboard
logout works
refresh keeps session


Phase 3: Supabase Setup
Goal

Create your database and connect it to Next.js.

What you learn
Supabase project setup
PostgreSQL tables
environment variables
server/client Supabase connection
Deliverables

Tables:

profiles
vaults
vault_items
notes
subscriptions
security_audits
Testing

Test:

App can connect to Supabase
A logged-in Clerk user can create a profile row
You can read profile data in dashboard


Phase 4: Row Level Security
Goal

Make sure users only access their own data.

What you learn
Supabase RLS
user ownership
database-level security
Deliverables

RLS policies for:

profiles
vaults
vault_items
notes
subscriptions
Testing

Test:

User A cannot read User B’s vault
User A cannot update User B’s data
Logged-out users cannot access protected data

This is important before storing anything sensitive.


Phase 5: Client-Side Encryption
Goal

Build encryption before building the vault UI.

What you learn
Web Crypto API
AES-GCM encryption
PBKDF2 key derivation
salt and IV usage
why zero-knowledge matters
Deliverables

Crypto functions:

deriveVaultKey()
encryptText()
decryptText()
encryptVaultItem()
decryptVaultItem()
Testing

Test:

Encrypt text
Store ciphertext
Decrypt it correctly
Wrong master password fails
Supabase never receives plaintext

This phase is the heart of the app.



Phase 6: Vault Unlock Screen
Goal

Create B’s custom unlock experience.

What you learn
local state
secure UI flow
theme config usage
Deliverables

Special unlock page:

Welcome back, B.
Your little memory vault is locked.

[Unlock Vault]
[Use Passkey]

User enters master password here.

Testing

Test:

vault stays locked by default
password items are hidden while locked
unlocking derives encryption key
refreshing page locks vault again


Phase 7: Vault CRUD
Goal

Create, view, update, and delete password entries.

What you learn
forms
Supabase inserts
encrypted fields
loading/error states
Deliverables

User can save:

title
username/email
password
website URL
notes
favorite

But database stores:

title_ciphertext
username_ciphertext
password_ciphertext
url_ciphertext
notes_ciphertext
Testing

Test:

create password item
decrypt and display item
edit item
delete item
wrong key cannot decrypt
database only contains encrypted text


Phase 8: Notes Feature
Goal

Add secure notes.

What you learn
reusable encryption
multiple encrypted resource types
Deliverables

Notes section:

Little Notes

Fields:

title
content
favorite

Testing

Test:

create encrypted note
read encrypted note
edit encrypted note
delete encrypted note
Phase 9: Password Generator
Goal

Generate strong passwords locally.

What you learn
client-side utility logic
UI controls
password strength basics
Deliverables

Password generator with:

length
uppercase
lowercase
numbers
symbols
copy button
save to vault button
Testing

Test:

generated passwords respect settings
password is not sent anywhere
copy works
save-to-vault encrypts before storing
Phase 10: B’s Custom UI Theme System
Goal

Make the app personal but still scalable.

What you learn
theme config architecture
reusable design tokens
custom copy/text
light/dark mode
Deliverables

Theme files:

themes/default.ts
themes/b-memory-vault.ts

B theme includes:

pink/blue colors
B monogram
soft romantic dashboard
music/books/beach/snack motifs
custom labels

Example labels:

Passwords → Saved Keys
Notes → Little Notes
Generator → Magic Password Maker
Security → Safety Check
Testing

Test:

default theme works
B theme works
light mode works
dark mode works
changing theme does not break vault logic
Phase 11: Security Audit Page
Goal

Help user know if passwords are weak, reused, or breached.

What you learn
password analysis
local-only checks
safe breach checking
Deliverables

Security page:

Safety Check
Security score
Weak passwords
Reused passwords
Breached passwords
Testing

Test:

weak password detection works
reused password detection works
breached check does not expose full password
audit only runs after vault unlock
Phase 12: HaveIBeenPwned Password Breach Check
Goal

Check if passwords have appeared in known breaches.

How it works

You do not send the full password.

password → SHA-1 hash
send first 5 characters only
HIBP returns matching hash suffixes
check locally
Deliverables
breach check utility
API route proxy
warning badge on breached passwords
Testing

Test:

known breached password is detected
strong random password usually passes
full password is never sent
Phase 13: MFA and Passkeys
Goal

Secure account login using Clerk.

What you learn
Clerk MFA
TOTP
passkey sign-in
session security
Deliverables

Settings page:

Enable MFA
Manage passkeys
Manage sessions
Change account email/password through Clerk
Testing

Test:

login with TOTP
login with passkey if enabled
logout from all devices
protected routes still work
Phase 14: Auto-Lock and Clipboard Safety
Goal

Make the vault safer in daily use.

Deliverables
auto-lock after inactivity
manual lock button
hide revealed password after timeout
clear copied password after timeout where possible
Testing

Test:

vault locks after inactivity
refresh locks vault
logout clears vault key
revealed passwords hide again
Phase 15: Polish Dashboard UX
Goal

Make the app feel premium.

Deliverables

Dashboard layout:

Sidebar
Topbar
Search
Vault cards
Recent passwords
Favorite passwords
Little notes
Security score widget

Animations:

soft glow
smooth card hover
subtle floating particles
gentle page transitions
Testing

Test:

mobile layout
tablet layout
desktop layout
empty states
loading states
error states
Phase 16: SaaS Billing Prep
Goal

Prepare for future $10/month subscription.

Deliverables

Plans:

Free
Pro - $10/month

Free limits:

1 vault
25 password items
10 notes
basic password generator

Pro:

unlimited vaults
unlimited items
advanced audit
export/import
priority features
Testing

Test:

free user hits item limit
pro user bypasses limit
plan is checked before creating records
Phase 17: Stripe Checkout
Goal

Add paid subscription later without building payment UI.

Deliverables
Stripe Checkout route
Stripe webhook route
subscription table updates
billing portal link
Testing

Test:

checkout starts
successful payment updates user plan
cancelled payment does not upgrade user
webhook works locally
Phase 18: Production Deployment
Goal

Put the app online.

Deliverables

Deploy:

Next.js → Vercel
Database → Supabase
Auth → Clerk
Payments → Stripe
Testing

Production checklist:

environment variables set
Clerk production keys used
Supabase RLS enabled
Stripe webhook secret set
no plaintext logs
no master password logs
HTTPS working
Phase 19: Final Security Review
Goal

Catch dangerous mistakes before real usage.

Checklist

Confirm:

No plaintext passwords in database
No plaintext passwords in console logs
No master password sent to server
No encryption key stored permanently
RLS enabled
Routes protected
MFA available
Vault auto-lock works
Testing

Do a manual attack test:

inspect network requests
inspect Supabase rows
try wrong user access
try wrong master password
refresh page and confirm vault locks
Recommended Build Order

Do not start with the beautiful UI first.

Build in this order:

1. Next.js setup
2. Clerk auth
3. Supabase schema
4. RLS
5. encryption logic
6. vault unlock
7. password CRUD
8. B custom UI
9. notes
10. generator
11. security audit
12. MFA/passkeys
13. SaaS billing
14. deployment