import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { SIDEBAR_GROUPS } from "@/lib/sidebar-config";
import { cn } from "@/lib/utils";

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] ?? Icons.Circle;
  return <Cmp className={className} />;
}

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-6">
          <Link to="/dashboard" className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold tracking-tight text-primary">ROOMHY</span>
            <span className="text-xs font-medium text-muted-foreground">.com</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {SIDEBAR_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              {group.title && (
                <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.to === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.to ||
                        (item.to !== "/properties/new" &&
                          item.to === "/properties" &&
                          pathname === "/properties");
                  const strictActive = pathname === item.to;
                  const active = strictActive || isActive;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
                        />
                        <span className="truncate">{item.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-6 py-3 text-[11px] text-muted-foreground">
          © 2025 Roomhy. All rights reserved.
        </div>
      </aside>
    </>
  );
}