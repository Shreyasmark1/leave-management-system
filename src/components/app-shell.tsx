"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  History,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Tag,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/features/auth/queries";
import type { SessionUser } from "@/features/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const dashboardItem: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const myLeaveNav: NavItem[] = [
  { href: "/leave/apply", label: "Apply Leave", icon: CalendarPlus },
  { href: "/leave/history", label: "Leave History", icon: History },
];

const manageNav: NavItem[] = [
  { href: "/admin", label: "Admin Overview", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Approvals", icon: Inbox },
  { href: "/admin/employees", label: "Users", icon: Users },
  { href: "/admin/leave-types", label: "Leave Types", icon: Tag },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const isAdmin = user.role === "admin";

  const sections: NavSection[] = isAdmin
    ? [
        { title: "My Leave", items: myLeaveNav },
        { title: "Manage", items: manageNav },
      ]
    : [{ title: "My Leave", items: myLeaveNav }];

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  }

  const initials = getInitials(user.name);

  function isActive(href: string): boolean {
    return href === "/dashboard" || href === "/admin"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderSections() {
    return (
      <nav className="flex flex-col gap-5">
        <Link
          href={dashboardItem.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive(dashboardItem.href)
              ? "bg-accent font-medium text-accent-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <dashboardItem.icon className="size-4" />
          {dashboardItem.label}
        </Link>

        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-1">
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <CalendarDays className="size-5" />
          <span className="font-heading text-base font-semibold">Leave Manager</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {renderSections()}
        </div>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Log out"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            <span className="font-heading text-base font-semibold">Leave Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon-sm" aria-label="Open navigation">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link
                    href={dashboardItem.href}
                    className={cn(isActive(dashboardItem.href) && "font-medium")}
                  >
                    <dashboardItem.icon />
                    {dashboardItem.label}
                  </Link>
                </DropdownMenuItem>
                {sections.map((section) => (
                  <div key={section.title}>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </DropdownMenuLabel>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={cn(isActive(item.href) && "font-medium")}
                          >
                            <Icon />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Account">
                  <Avatar size="sm">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <span className="block truncate">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleLogout}
                  disabled={logout.isPending}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}