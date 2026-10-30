"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";
import { NavigationGuardProvider } from "./NavigationGuard";
import { Sidebar } from "./Sidebar";
import { resolveBreadcrumb, TopBar } from "./TopBar";

/**
 * Persistent chrome around every signed-in screen: sidebar + top bar + scrollable
 * content. The one client boundary in the layout — pages stay Server Components.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <ToastProvider>
      <NavigationGuardProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar collapsed={collapsed} />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <TopBar breadcrumb={resolveBreadcrumb(pathname)} onToggleSidebar={() => setCollapsed((c) => !c)} />
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </NavigationGuardProvider>
    </ToastProvider>
  );
}
