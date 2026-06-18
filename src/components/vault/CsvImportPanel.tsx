"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Papa from "papaparse";
import { encryptVaultItem } from "@/lib/crypto/vaultCrypto";
import { ensureUserProfile } from "@/lib/supabase/profile";
import { createVaultItem } from "@/lib/supabase/vaultItems";
import { createVault, getVaults } from "@/lib/supabase/vaults";
import { useVault } from "./VaultProvider";
import type { VaultItemFormValues } from "@/types/vault";

type ImportRow = {
  rowNumber: number;
  title: string;
  username: string;
  password: string;
  url: string;
};

type SkippedRow = {
  rowNumber: number;
  reason: string;
};

type PanelState = "idle" | "preview" | "importing" | "done";

const PREVIEW_LIMIT = 10;

const panelCls =
  "mt-6 rounded-vault-panel border border-vault-border bg-vault-card p-6";

const inputCls =
  "w-full rounded-vault-input border border-vault-border bg-vault-inset px-4 py-3 text-sm " +
  "text-vault-text placeholder:text-vault-text-faint outline-none transition focus:border-vault-accent/50";

const primaryBtnCls =
  "rounded-vault-input bg-vault-accent px-5 py-2.5 text-sm font-semibold " +
  "text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const quietBtnCls =
  "rounded-vault-chip border border-vault-border px-4 py-2.5 text-sm font-medium " +
  "text-vault-text-muted transition hover:bg-vault-overlay/[0.04] hover:text-vault-text";

function parseCsvText(text: string): { valid: ImportRow[]; skipped: SkippedRow[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const valid: ImportRow[] = [];
  const skipped: SkippedRow[] = [];

  result.data.forEach((raw, idx) => {
    const rowNumber = idx + 2; // +2: 1-based + skip header row
    const title = (raw["title"] ?? "").trim();
    const password = (raw["password"] ?? "").trim();
    const username = (raw["username"] ?? "").trim();
    const url = (raw["url"] ?? "").trim();

    if (!title && !password) {
      skipped.push({ rowNumber, reason: "Missing title and password" });
    } else if (!title) {
      skipped.push({ rowNumber, reason: "Missing title" });
    } else if (!password) {
      skipped.push({ rowNumber, reason: "Missing password" });
    } else {
      valid.push({ rowNumber, title, username, password, url });
    }
  });

  return { valid, skipped };
}

export function CsvImportPanel({ onImported }: { onImported: () => Promise<void> }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { isUnlocked, vaultKey, vaultSalt } = useVault();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [state, setState] = useState<PanelState>("idle");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const [validRows, setValidRows] = useState<ImportRow[]>([]);
  const [skippedRows, setSkippedRows] = useState<SkippedRow[]>([]);

  const [importProgress, setImportProgress] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [finalSkipped, setFinalSkipped] = useState<SkippedRow[]>([]);

  async function getOrCreateDefaultVault(profileId: string) {
    const vaults = await getVaults(getToken);
    if (vaults.length > 0) return vaults[0];
    return createVault({
      profileId,
      getToken,
      name: "B's Main Vault",
      description: "Default vault for saved keys.",
    });
  }

  function handleParse(text: string) {
    const { valid, skipped } = parseCsvText(text);
    setValidRows(valid);
    setSkippedRows(skipped);
    setState("preview");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleParse((ev.target?.result as string) ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    handleParse(pasteText);
  }

  function reset() {
    setState("idle");
    setShowPaste(false);
    setPasteText("");
    setValidRows([]);
    setSkippedRows([]);
    setImportProgress("");
    setImportedCount(0);
    setFinalSkipped([]);
  }

  async function handleConfirmImport() {
    if (!user || !isUnlocked || !vaultKey || !vaultSalt) return;

    setState("importing");
    setImportProgress(`Starting import of ${validRows.length} entries…`);

    const profile = await ensureUserProfile({ user, getToken });
    const vault = await getOrCreateDefaultVault(profile.id);

    let saved = 0;
    const encryptErrors: SkippedRow[] = [...skippedRows];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      setImportProgress(`Encrypting and saving ${i + 1} of ${validRows.length}…`);

      const values: VaultItemFormValues = {
        title: row.title,
        username: row.username,
        password: row.password,
        url: row.url,
        notes: "",
        favorite: false,
      };

      try {
        const encrypted = await encryptVaultItem({
          values,
          key: vaultKey,
          ownerId: profile.id,
          vaultId: vault.id,
          salt: vaultSalt,
        });

        await createVaultItem({ getToken, item: encrypted });
        saved++;
      } catch {
        encryptErrors.push({ rowNumber: row.rowNumber, reason: "Encryption or save failed" });
      }
    }

    setImportedCount(saved);
    setFinalSkipped(encryptErrors);
    setState("done");
    await onImported();
  }

  // ── Idle ─────────────────────────────────────────────────────────────────────
  if (state === "idle") {
    return (
      <section className={panelCls}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
            Saved Keys
          </p>
          <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
            Import from CSV
          </h2>
          <p className="mt-1.5 text-sm text-vault-text-muted">
            Passwords are parsed and encrypted in this browser — the CSV is never uploaded.
          </p>
        </div>

        {!isUnlocked && (
          <div className="mt-5 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
            <p className="text-xs text-vault-text-muted">
              Unlock the vault before importing.
            </p>
          </div>
        )}

        <div className="mt-5 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
          <p className="text-xs font-medium text-vault-text-muted">Expected format</p>
          <p className="mt-1 font-mono text-xs text-vault-text-faint">
            title,username,password,url
          </p>
          <p className="mt-1 text-xs text-vault-text-faint">
            First row must be the header. <code className="font-mono">title</code> and{" "}
            <code className="font-mono">password</code> are required;{" "}
            <code className="font-mono">username</code> and{" "}
            <code className="font-mono">url</code> are optional.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!isUnlocked}
            onClick={() => fileInputRef.current?.click()}
            className={primaryBtnCls}
          >
            Choose CSV file
          </button>

          <button
            type="button"
            disabled={!isUnlocked}
            onClick={() => setShowPaste((v) => !v)}
            className={quietBtnCls}
          >
            {showPaste ? "Hide paste area" : "Paste CSV instead"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {showPaste && isUnlocked && (
          <div className="mt-4 grid gap-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className={inputCls + " min-h-36 resize-y font-mono text-xs"}
              placeholder={"title,username,password,url\nNetflix,b@example.com,hunter2,https://netflix.com"}
              spellCheck={false}
            />
            <div>
              <button
                type="button"
                disabled={!pasteText.trim()}
                onClick={handlePasteSubmit}
                className={primaryBtnCls}
              >
                Parse &amp; Preview
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  // ── Preview ───────────────────────────────────────────────────────────────────
  if (state === "preview") {
    const previewRows = validRows.slice(0, PREVIEW_LIMIT);
    const overflow = validRows.length - PREVIEW_LIMIT;

    return (
      <section className={panelCls}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
            Saved Keys
          </p>
          <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
            Preview import
          </h2>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-vault-chip border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {validRows.length} {validRows.length === 1 ? "entry" : "entries"} ready
            </p>
          </div>
          {skippedRows.length > 0 && (
            <div className="rounded-vault-chip border border-amber-400/20 bg-amber-500/10 px-4 py-2.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {skippedRows.length} {skippedRows.length === 1 ? "row" : "rows"} will be skipped
              </p>
            </div>
          )}
        </div>

        {validRows.length === 0 ? (
          <div className="mt-5 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
            <p className="text-sm text-vault-text-muted">
              No valid entries found. Check that the CSV has a header row and that title and password columns are filled in.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-vault-card border border-vault-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vault-border bg-vault-inset">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-vault-text-faint">Title</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-vault-text-faint">Username</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-vault-text-faint">URL</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-vault-text-faint">Password</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr key={row.rowNumber} className="border-b border-vault-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-vault-text">{row.title}</td>
                    <td className="px-4 py-2.5 text-vault-text-muted">{row.username || <span className="text-vault-text-faint">—</span>}</td>
                    <td className="px-4 py-2.5 text-vault-text-muted">{row.url || <span className="text-vault-text-faint">—</span>}</td>
                    <td className="px-4 py-2.5 font-mono text-vault-text-faint tracking-widest">•••••••</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overflow > 0 && (
              <p className="px-4 py-2.5 text-xs text-vault-text-faint">
                + {overflow} more {overflow === 1 ? "entry" : "entries"} not shown
              </p>
            )}
          </div>
        )}

        {skippedRows.length > 0 && (
          <div className="mt-4 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
            <p className="text-xs font-medium text-vault-text-muted mb-2">Rows that will be skipped</p>
            <ul className="grid gap-0.5">
              {skippedRows.map((s) => (
                <li key={s.rowNumber} className="text-xs text-vault-text-faint">
                  Row {s.rowNumber}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleConfirmImport}
            className={primaryBtnCls}
          >
            Import {validRows.length} {validRows.length === 1 ? "password" : "passwords"}
          </button>
          <button type="button" onClick={reset} className={quietBtnCls}>
            Cancel
          </button>
        </div>
      </section>
    );
  }

  // ── Importing ─────────────────────────────────────────────────────────────────
  if (state === "importing") {
    return (
      <section className={panelCls}>
        <h2 className="font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Importing…
        </h2>
        <p className="mt-3 text-sm text-vault-text-muted">{importProgress}</p>
      </section>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  return (
    <section className={panelCls}>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          Saved Keys
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Import complete
        </h2>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-vault-chip border border-emerald-400/20 bg-emerald-500/10 px-4 py-2.5">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            {importedCount} {importedCount === 1 ? "password" : "passwords"} imported
          </p>
        </div>
        {finalSkipped.length > 0 && (
          <div className="rounded-vault-chip border border-amber-400/20 bg-amber-500/10 px-4 py-2.5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {finalSkipped.length} skipped
            </p>
          </div>
        )}
      </div>

      {finalSkipped.length > 0 && (
        <div className="mt-4 rounded-vault-chip border border-vault-border bg-vault-overlay/[0.03] px-4 py-3">
          <p className="text-xs font-medium text-vault-text-muted mb-2">Skipped rows</p>
          <ul className="grid gap-0.5">
            {finalSkipped.map((s, i) => (
              <li key={i} className="text-xs text-vault-text-faint">
                Row {s.rowNumber}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 rounded-vault-card border border-yellow-300/20 bg-yellow-500/10 p-4">
        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
          Delete the CSV file.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-yellow-900/80 dark:text-yellow-100/80">
          Your passwords have been encrypted and saved. Delete the CSV from your device and empty the Trash — it contains plaintext passwords.
        </p>
      </div>

      <div className="mt-5">
        <button type="button" onClick={reset} className={quietBtnCls}>
          Import more
        </button>
      </div>
    </section>
  );
}
