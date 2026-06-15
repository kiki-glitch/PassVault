import { AccountSecurityPanel } from "./AccountSecurityPanel";
import { BackupSettingsPanel } from "./BackupSettingsPanel";

export function SettingsSection() {
  return (
    <div className="grid gap-6">
      <AccountSecurityPanel />

      <BackupSettingsPanel />

      <section className="rounded-vault-panel border border-vault-border bg-vault-card p-6">
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          Vault Settings
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Vault preferences
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-vault-text-muted">
          Coming next: configurable auto-lock duration, theme options, and vault
          reset controls.
        </p>

        <div className="mt-5 rounded-vault-card border border-yellow-300/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
            Zero-knowledge reminder
          </p>
          <p className="mt-2 text-sm leading-6 text-yellow-900/80 dark:text-yellow-100/80">
            Your vault master password is not stored anywhere. Account recovery
            through Clerk does not recover encrypted vault data.
          </p>
        </div>
      </section>
    </div>
  );
}
