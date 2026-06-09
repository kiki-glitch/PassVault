import { AccountSecurityPanel } from "./AccountSecurityPanel";

export function SettingsSection() {
  return (
    <div className="grid gap-6">
      <AccountSecurityPanel />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-pink-300">Vault Settings</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Vault preferences
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Coming next: configurable auto-lock duration, encrypted backup/export,
          and vault reset controls.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-semibold text-yellow-100">
            Zero-knowledge reminder
          </p>
          <p className="mt-2 text-sm leading-6 text-yellow-100/80">
            Your vault master password is not stored anywhere. Account recovery
            through Clerk does not recover encrypted vault data.
          </p>
        </div>
      </section>
    </div>
  );
}