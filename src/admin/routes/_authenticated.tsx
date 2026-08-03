import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isReady) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AppHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="min-h-[calc(100vh-4rem)] px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}