"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Shown in place of the interview when there is no valid session cookie. */
export function AccessGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        // The cookie is set; re-render the server component to reveal the flow.
        router.refresh();
        return;
      }

      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Access code</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        This demo calls a paid API, so it sits behind a shared passphrase. The
        code is included in the written description submitted with this packet.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Don’t have it handy? The{" "}
        <a href="/sample" className="underline underline-offset-4">
          sample report
        </a>{" "}
        shows the finished output and needs no code.
      </p>

      <form onSubmit={submit} className="mt-6">
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          placeholder="Enter code"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-foreground/40"
        />
        {error && <p className="mt-2 text-xs text-misaligned">{error}</p>}
        <button
          type="submit"
          disabled={submitting || code.length === 0}
          className="mt-4 w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-40"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
