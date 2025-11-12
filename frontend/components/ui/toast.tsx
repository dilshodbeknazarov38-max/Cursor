"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  onDismiss?: () => void;
};

export function Toast({
  title,
  description,
  action,
  variant = "default",
  onDismiss,
}: ToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 overflow-hidden rounded-xl border px-4 py-3 shadow-lg transition-opacity",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-neutral-200 bg-white text-neutral-800",
      )}
    >
      <div className="flex-1">
        {title ? (
          <p className="text-sm font-semibold leading-tight text-current">
            {title}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
        ) : null}
        {action ? <div className="mt-2 text-sm">{action}</div> : null}
      </div>
      {onDismiss ? (
        <button
          onClick={onDismiss}
          className="ml-2 rounded-full p-1 text-xs text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
          aria-label="Yopish"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
