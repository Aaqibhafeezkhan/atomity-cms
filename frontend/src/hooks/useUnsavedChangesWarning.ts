"use client";

import { useEffect } from "react";

/**
 * Asks the browser to confirm before closing or reloading the tab while there are
 * unsaved changes. In-app navigation is guarded separately (see the editor's back link),
 * since the App Router has no route-change event to intercept.
 */
export function useUnsavedChangesWarning(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
