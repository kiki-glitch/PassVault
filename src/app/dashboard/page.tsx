import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PasswordGenerator } from "@/components/vault/PasswordGenerator";
import { SecureNotesSection } from "@/components/vault/SecureNotesSection";
import { VaultDashboardSection } from "@/components/vault/VaultDashboardSection";
import { SecurityAuditSection } from "@/components/vault/SecurityAuditSection";
import { SettingsSection } from "@/components/settings/SettingsSection";

export default function DashboardPage() {
  return (
    <DashboardShell
      passwordsSection={<VaultDashboardSection />}
      notesSection={<SecureNotesSection />}
      generatorSection={<PasswordGenerator />}
      securitySection={<SecurityAuditSection />}
      settingsSection={<SettingsSection />}
    />
  );
}
