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
      return {
        widthClass: "w-1/3",
        colorClass: "bg-red-400",
        textClass: "text-red-200",
      };
    case "Good":
      return {
        widthClass: "w-2/3",
        colorClass: "bg-orange-400",
        textClass: "text-orange-200",
      };
    case "Strong":
      return {
        widthClass: "w-full",
        colorClass: "bg-emerald-400",
        textClass: "text-emerald-200",
      };
    default:
      return {
        widthClass: "w-0",
        colorClass: "bg-slate-500",
        textClass: "text-slate-300",
      };
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
    <section className="mt-8 rounded-3xl border border-blue-300/20 bg-white/5 p-6 shadow-lg shadow-blue-500/5">
      <div>
        <p className="text-sm text-blue-300">{bMemoryVaultTheme.labels.generator}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Generate a strong password
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Passwords are generated locally and are not sent anywhere.
        </p>
      </div>

      <div className="mt-6 grid gap-5">
        <label className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-300">Length</span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-sm text-blue-200">
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
            className="w-full"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeUppercase}
              onChange={(event) =>
                updateOption("includeUppercase", event.target.checked)
              }
            />
            Uppercase letters
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeLowercase}
              onChange={(event) =>
                updateOption("includeLowercase", event.target.checked)
              }
            />
            Lowercase letters
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeNumbers}
              onChange={(event) =>
                updateOption("includeNumbers", event.target.checked)
              }
            />
            Numbers
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={options.includeSymbols}
              onChange={(event) =>
                updateOption("includeSymbols", event.target.checked)
              }
            />
            Symbols
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded-full bg-blue-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-300"
          >
            Generate Password
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-pink-300/40 px-6 py-3 text-sm font-semibold text-pink-200 transition hover:bg-pink-300/10"
          >
            Copy
          </button>
        </div>

        {generatedPassword && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-400">Generated password</p>
            <p className="mt-2 break-all font-mono text-lg text-white">
              {generatedPassword}
            </p>

            {strength && strengthStyles && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className={`text-sm font-semibold ${strengthStyles.textClass}`}>
                    Strength: {strength.label}
                  </p>
                  <p className="text-xs text-slate-400">
                    {strength.description}
                  </p>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700/60">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthStyles.widthClass} ${strengthStyles.colorClass}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {message && <p className="text-sm text-blue-200">{message}</p>}
      </div>
    </section>
  );
}