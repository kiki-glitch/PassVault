"use client";

import { useState } from "react";
import {
  generatePassword,
  getPasswordStrength,
  type PasswordGeneratorOptions,
} from "@/lib/crypto/passwordGenerator";
import { bMemoryVaultTheme } from "@/config/themes";

const defaultOptions: PasswordGeneratorOptions = {
  length: 18,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

function getStrengthBarStyles(label: string) {
  switch (label) {
    case "Weak":
      return { widthClass: "w-1/3",  colorClass: "bg-red-400",     textClass: "text-red-400" };
    case "Good":
      return { widthClass: "w-2/3",  colorClass: "bg-amber-400",   textClass: "text-amber-400" };
    case "Strong":
      return { widthClass: "w-full", colorClass: "bg-emerald-400", textClass: "text-emerald-400" };
    default:
      return { widthClass: "w-0",    colorClass: "bg-white/20",    textClass: "text-vault-text-faint" };
  }
}

export function PasswordGenerator() {
  const [options, setOptions] =
    useState<PasswordGeneratorOptions>(defaultOptions);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [message, setMessage] = useState("");

  const strength = generatedPassword
    ? getPasswordStrength(generatedPassword)
    : null;

  const strengthStyles = strength
    ? getStrengthBarStyles(strength.label)
    : null;

  function updateOption<Field extends keyof PasswordGeneratorOptions>(
    field: Field,
    value: PasswordGeneratorOptions[Field]
  ) {
    setOptions((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleGenerate() {
    try {
      const password = generatePassword(options);
      setGeneratedPassword(password);
      setMessage("Password generated locally in your browser.");
    } catch (error) {
      console.error("Password generation failed:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not generate password."
      );
    }
  }

  async function handleCopy() {
    if (!generatedPassword) {
      setMessage("Generate a password first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPassword);
      setMessage("Generated password copied.");
    } catch {
      setMessage("Could not copy password.");
    }
  }

  return (
    <section className="mt-6 rounded-vault-panel border border-white/8 bg-vault-card p-6">

      {/* Section header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-vault-accent/60">
          {bMemoryVaultTheme.labels.generator}
        </p>
        <h2 className="mt-1 font-display text-[1.65rem] font-medium leading-tight tracking-tight text-vault-text">
          Generate a strong password
        </h2>
        <p className="mt-1.5 text-sm text-vault-text-muted">
          Passwords are generated locally and are not sent anywhere.
        </p>
      </div>

      <div className="mt-6 grid gap-5">

        {/* Length slider */}
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-vault-text-muted">Length</span>
            <span className="rounded-vault-chip border border-white/8 bg-black/30 px-2.5 py-1 text-xs font-medium text-vault-accent/70">
              {options.length}
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={40}
            value={options.length}
            onChange={(event) =>
              updateOption("length", Number(event.target.value))
            }
            className="w-full accent-[var(--vault-accent)]"
          />
        </div>

        {/* Character type toggles */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: "includeUppercase", label: "Uppercase" },
              { key: "includeLowercase", label: "Lowercase" },
              { key: "includeNumbers",   label: "Numbers"   },
              { key: "includeSymbols",   label: "Symbols"   },
            ] as { key: keyof PasswordGeneratorOptions; label: string }[]
          ).map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-vault-card border border-white/8 bg-black/20 p-3 text-sm text-vault-text-muted transition has-[:checked]:border-vault-accent/20 has-[:checked]:bg-vault-accent/[0.05] has-[:checked]:text-vault-text/80"
            >
              <input
                type="checkbox"
                checked={options[key] as boolean}
                onChange={(event) => updateOption(key, event.target.checked)}
                className="accent-[var(--vault-accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-vault-input bg-vault-accent px-8 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          >
            Generate
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-vault-input border border-white/10 px-6 py-3 text-sm font-medium text-vault-text-muted transition hover:bg-white/[0.04] hover:text-vault-text/80"
          >
            Copy
          </button>
        </div>

        {message && <p className="text-xs text-vault-text-muted">{message}</p>}

        {/* Output + strength */}
        {generatedPassword && (
          <div className="rounded-vault-card border border-white/8 bg-black/30 p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-vault-text-faint">
              Generated password
            </p>
            <p className="mt-3 break-all font-mono text-base leading-relaxed text-vault-text">
              {generatedPassword}
            </p>

            {strength && strengthStyles && (
              <div className="mt-4 grid gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${strengthStyles.textClass}`}>
                    {strength.label}
                  </span>
                  <span className="text-xs text-vault-text-faint">{strength.description}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strengthStyles.widthClass} ${strengthStyles.colorClass}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
