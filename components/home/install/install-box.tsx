"use client";

import { BorderBeam } from "border-beam";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { site } from "@/lib/site";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener?.("change", onChange);
  return () => media.removeEventListener?.("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The install command in a code box with a copy button and a border beam. */
export function InstallBox() {
  const reduced = usePrefersReducedMotion();
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.installCommand);
      setMessage("Copied");
    } catch {
      setMessage("Copy failed. Select the command and copy it.");
    }
  }

  return (
    <BorderBeam active={!reduced} colorVariant="mono" theme="light" className="max-w-full rounded-card">
      <div className="flex flex-col gap-4 rounded-card border-2 border-sand-200 bg-sand-100 p-4 sm:p-6">
        <pre className="m-0 min-w-0 overflow-x-auto rounded-xl bg-ink p-4 text-sm text-sand-50">
          <code className="break-all whitespace-pre-wrap">{site.installCommand}</code>
        </pre>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-pill bg-forest px-5 py-2 font-semibold text-sand-50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {message === "Copied" ? <CheckIcon className="size-4" aria-hidden /> : <CopyIcon className="size-4" aria-hidden />}
            Copy command
          </button>
          <span aria-live="polite" role="status" className="text-sm font-semibold text-forest">
            {message}
          </span>
        </div>
      </div>
    </BorderBeam>
  );
}
