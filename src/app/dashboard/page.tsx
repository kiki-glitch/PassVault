import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PasswordGenerator } from "@/components/vault/PasswordGenerator";
import { SecureNotesSection } from "@/components/vault/SecureNotesSection";
import { VaultDashboardSection } from "@/components/vault/VaultDashboardSection";
import { VaultUnlockCard } from "@/components/vault/VaultUnlockCard";

export default function DashboardPage() {
  return (
    <DashboardShell
      passwordsSection={
        <>
          <VaultUnlockCard />
          <VaultDashboardSection />
        </>
      }
      notesSection={
        <>
          <VaultUnlockCard />
          <SecureNotesSection />
        </>
      }
      generatorSection={<PasswordGenerator />}
    />
  );
}