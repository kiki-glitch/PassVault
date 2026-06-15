import type { Theme } from "@/types/theme";

export const bMemoryVaultTheme = {
  id: "b-memory-vault",
  appName: "B's Memory Vault",
  ownerInitial: "B",

  copy: {
    landingTitle: "B's Memory Vault",
    landingSubtitle:
      "A soft little place for passwords, notes, and things you might forget.",
    unlockTitle: "Welcome back, B.",
    unlockSubtitle: "Your little memory vault is locked.",
    unlockButton: "Unlock Vault",
    setupTitle: "Create your master password",
    setupSubtitle:
      "This password unlocks your vault and is separate from your account login.",
    setupNotice:
      "Your master password is never sent to the server. If forgotten, saved vault data cannot be decrypted.",
    dashboardGreeting: "Hi B, your safe little corner is ready.",
    dashboardEyebrow: "B's private corner",
    dashboardSubtitle:
      "Manage saved keys, little notes, and password generation from one clean space.",
    vaultLocked: "Vault locked",
    revealPassword: "Show me",
    hidePassword: "Hide",
    copyPassword: "Copy safely",
  },

  labels: {
    passwords: "Saved Keys",
    notes: "Little Notes",
    generator: "Magic Password Maker",
    security: "Safety Check",
    favorites: "Safe Favorites",
    settings: "Settings",
    passwordsDescription: "Passwords and logins",
    notesDescription: "Private encrypted notes",
    generatorDescription: "Generate strong passwords",
    securityDescription: "Audit saved passwords",
    settingsDescription: "Vault preferences",
  },

  colors: {
    pink: "#f472b6",
    blue: "#60a5fa",
    darkBackground: "#090812",
    darkCard: "#151426",
    lightBackground: "#fff7fb",
    lightCard: "#ffffff",
    accent: "#f472b6",
    support: "#60a5fa",
  },

  fonts: {
    display: "var(--font-fraunces)",
    body: "var(--font-geist-sans)",
  },

  radius: {
    panel: "24px",
    card: "16px",
    input: "12px",
    chip: "8px",
  },
} satisfies Theme;
