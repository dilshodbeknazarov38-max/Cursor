"use client";

import * as React from "react";

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

type Toast = Omit<ToasterToast, "id">;

const listeners = new Set<(toast: ToasterToast) => void>();

export function useToast() {
  const toast = React.useCallback((props: Toast) => {
    const id = crypto.randomUUID();
    const toastWithId = { id, ...props };
    listeners.forEach((listener) => listener(toastWithId));
    return id;
  }, []);

  return { toast };
}

export type { ToasterToast, Toast };
export { listeners as toastListeners };
