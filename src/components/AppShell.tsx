import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UserPlus,
  Building2,
  ListChecks,
  BadgeDollarSign,
  HelpCircle,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/indicar-pesquisador", label: "Indicar Pesquisador", icon: UserPlus },
  { to: "/indicar-empresa", label: "Indicar Empresa", icon: Building2 },
  { to: "/minhas-indicacoes", label: "Minhas Indicações", icon: ListChecks },
  { to: "/minhas-bonificacoes", label: "Bonificações", icon: BadgeDollarSign },
  { to: "/como-funciona", label: "Como Funciona", icon: HelpCircle },
  { to: "/perfil", label: "Meu Perfil", icon: User },
] as const;

const ADMIN_NAV = [{ to: "/admin", label: "Painel Admin", icon: Shield }] as const;

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { profile, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}

      {isAdmin && (
        <>
          <p className="mt-5 px-3 pb-1 text-[11px] font-bold tracking-widest text-sidebar-foreground/40 uppercase">
            Administração
          </p>
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
        <div className="px-5 py-6">
          <Logo />
        </div>
        {nav}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar">
            <div className="flex items-center justify-between px-5 py-6">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="size-5 text-sidebar-foreground" />
              </button>
            </div>
            {nav}
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={sair}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75"
              >
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {user ? <NotificationBell userId={user.id} /> : null}
            <div className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex">
              <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {(profile?.nome_completo ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="max-w-32 truncate text-xs font-semibold">{profile?.nome_completo}</p>
                <p className="text-[11px] text-muted-foreground">
                  {isAdmin ? "Admin" : "Indicador"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={sair}
              className="sm:hidden"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
