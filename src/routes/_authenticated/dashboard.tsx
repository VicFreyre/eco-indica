import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  CheckCircle2,
  BadgeCheck,
  Wallet,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { brl, dataCurta } from "@/lib/domain";
import { INDICACAO_SELECT, nomeIndicacao, type Indicacao } from "@/lib/types";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ECO INDICA" },
      { name: "description", content: "Acompanhe suas indicações e bonificações no ECO INDICA." },
      { property: "og:title", content: "Dashboard — ECO INDICA" },
      { property: "og:description", content: "Acompanhe suas indicações e bonificações." },
    ],
  }),
  component: DashboardPage,
});

const CONVERTIDAS = ["Pago", "Relatório aprovado", "Bonificação aprovada", "Fechada"];

function DashboardPage() {
  const { profile, user } = useAuth();
  const { data: config, error: configError } = useBonificacaoConfig();

  const { data, isLoading, error } = useQuery({
    queryKey: ["indicacoes", "minhas", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicacoes")
        .select(INDICACAO_SELECT)
        .eq("indicador_id", user!.id)
        .order("data_registro", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Indicacao[];
    },
  });

  const lista = data ?? [];
  const bonificacoes = lista.flatMap((i) => i.bonificacoes ?? []);
  const soma = (status: string[]) =>
    bonificacoes.filter((b) => status.includes(b.status)).reduce((t, b) => t + Number(b.valor), 0);

  return (
    <AppShell
      title={`Olá, ${profile?.nome_completo?.split(" ")[0] ?? "indicador"}`}
      description="Resumo do seu programa de indicações"
      actions={
        <Button asChild className="hidden font-semibold sm:inline-flex">
          <Link to="/indicar-empresa">Nova indicação</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="surface p-6 text-sm text-destructive">
          Não foi possível carregar seus dados. Atualize a página e tente novamente.
        </p>
      ) : (
        <div className="space-y-6">
          {configError && (
            <p className="surface p-4 text-sm text-destructive">
              Não foi possível carregar os valores de bonificação configurados.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Pesquisadores indicados"
              value={lista.filter((i) => i.tipo === "pesquisador").length}
              icon={Users}
            />
            <StatCard
              label="Empresas indicadas"
              value={lista.filter((i) => i.tipo === "empresa").length}
              icon={Building2}
            />
            <StatCard
              label="Indicações convertidas"
              value={lista.filter((i) => CONVERTIDAS.includes(i.status)).length}
              icon={CheckCircle2}
            />
            <StatCard
              label="Bonificações aprovadas"
              value={brl(soma(["Aprovada", "Pagamento programado"]))}
              icon={BadgeCheck}
            />
            <StatCard
              label="Bonificações pagas"
              value={brl(soma(["Paga"]))}
              icon={Wallet}
              highlight
            />
            <StatCard label="Bonificações pendentes" value={brl(soma(["Pendente"]))} icon={Clock} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Link
              to="/indicar-pesquisador"
              className="surface group flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary"
            >
              <div>
                <p className="font-semibold">Indicar pesquisador</p>
                <p className="text-sm text-muted-foreground">
                  {config
                    ? `Bonificação de ${brl(config.valorPesquisador)}`
                    : "Valor de bonificação"}
                </p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/indicar-empresa"
              className="surface group flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary"
            >
              <div>
                <p className="font-semibold">Indicar empresa</p>
                <p className="text-sm text-muted-foreground">
                  {config ? `Bonificação de ${brl(config.valorEmpresa)}` : "Valor de bonificação"}
                </p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/como-funciona"
              className="surface group flex items-center justify-between gap-4 p-5 transition-colors hover:border-primary"
            >
              <div>
                <p className="font-semibold">Como funciona</p>
                <p className="text-sm text-muted-foreground">Regras do programa</p>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Últimas indicações</h2>
              <Link
                to="/minhas-indicacoes"
                className="text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                Ver todas
              </Link>
            </div>
            {lista.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Você ainda não registrou indicações. Comece indicando um pesquisador ou uma
                  empresa.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {lista.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{nomeIndicacao(i)}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.tipo === "pesquisador" ? "Pesquisador" : "Empresa"} ·{" "}
                        {dataCurta(i.data_registro)}
                      </p>
                    </div>
                    <StatusBadge status={i.status} />
                    <span className="w-20 text-right text-sm font-semibold">
                      {brl(i.bonificacoes?.[0]?.valor ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
