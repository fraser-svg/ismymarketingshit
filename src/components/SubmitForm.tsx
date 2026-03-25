"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

function isValidDomain(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(" ")) return false;
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
    trimmed,
  );
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function SubmitForm() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [domainTouched, setDomainTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const domainInvalid = domainTouched && domain.length > 0 && !isValidDomain(domain);
  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);
  const canSubmit =
    isValidDomain(domain) && isValidEmail(email) && formState !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDomainTouched(true);
    setEmailTouched(true);

    if (!canSubmit) return;

    setFormState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          email: email.trim(),
          website: honeypot,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? `Request failed with status ${response.status}`,
        );
      }

      setFormState("success");
    } catch (err) {
      setFormState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    }
  }

  if (formState === "success") {
    return (
      <div className="w-full rounded-lg border border-zinc-200 px-6 py-8 text-center sm:px-8">
        <p className="text-lg font-medium text-zinc-900">
          We&rsquo;re analysing your messaging now.
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          You&rsquo;ll receive your report by email within 5 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 px-6 py-8 sm:px-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="domain"
            className="block text-sm font-medium text-zinc-700"
          >
            Company domain
          </label>
          <input
            id="domain"
            type="text"
            placeholder="example.co.uk"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onBlur={() => setDomainTouched(true)}
            required
            className={`mt-1.5 block w-full rounded-md border px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
              domainInvalid ? "border-red-400" : "border-zinc-300"
            }`}
          />
          {domainInvalid && (
            <p className="mt-1 text-xs text-red-600">Enter a valid domain</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            required
            className={`mt-1.5 block w-full rounded-md border px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${
              emailInvalid ? "border-red-400" : "border-zinc-300"
            }`}
          />
          {emailInvalid && (
            <p className="mt-1 text-xs text-red-600">
              Enter a valid email address
            </p>
          )}
        </div>

        {/* Honeypot field — visually hidden, catches bots */}
        <div
          aria-hidden="true"
          className="absolute overflow-hidden"
          style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, width: 0, overflow: "hidden" }}
          tabIndex={-1}
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-1 flex h-12 w-full items-center justify-center rounded-md bg-[#2563eb] text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {formState === "loading" ? "Submitting..." : "Run my diagnostic"}
        </button>

        {formState === "error" && errorMessage && (
          <p className="text-center text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
