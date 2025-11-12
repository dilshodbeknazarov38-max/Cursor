"use client";

import * as React from "react";

import { toastListeners, type ToasterToast } from "@/components/ui/use-toast";

import { Toast } from "./toast";

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  React.useEffect(() => {
    const listener = (toast: ToasterToast) => {
      setToasts((current) => [...current, toast]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, 4500);
      return () => clearTimeout(timer);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-3 p-4 sm:p-6">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          description={toast.description}
          action={toast.action}
          variant={toast.variant}
          onDismiss={() =>
            setToasts((prev) => prev.filter((item) => item.id !== toast.id))
          }
        />
      ))}
    </div>
  );
}
