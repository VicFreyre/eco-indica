import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet, ArrowDownLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, dataCurta } from "@/lib/domain";
import type { Bonificacao, Movimentacao } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — ECO INDICA" },
      { name: "description", content: "Saldo a receber, valores recebidos e histórico de pagamentos." },
      { property: "og:title", content: "Financeiro — ECO INDICA" },
      { property: "og:description", content: "Saldo a receber, valores recebidos e histórico de pagamentos." },
    ],
  }),
  component: FinanceiroIndicador,
});

function FinanceiroIndicador() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["financeiro", "indicador", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [bon, mov] = await Promise.all([
        supabase.from("bonificacoes").select("*").eq("indicador_id", user!.id),
        supabase
          .from("movimentacoes_financeiras")
          .select("*")
          .eq("indicador_id", user!.id)
          .order("data", { ascending: false }),
      ]);
      if (bon.error) throw bon.error;
      if (mov.error) throw mov.error;
      return {
        bonificacoes: (bon.data ?? []) as Bonificacao[],
        movimentacoes: (mov.data ?? []) as Movimentacao[],
      };
    },
  });

  const bonificacoes = data?.bonificacoes ?? [];
  const movimentacoes = data?.movimentacoes ?? [];
  const soma = (s: string[]) =>
    bonificacoes.filter((b) => s.includes(b.status)).reduce((t, b) => t + Number(b.valor), 0);

  const recebido = soma(["Paga"]);
  const aReceber = soma(["Aprovada", "Pagamento programado"]);
  const pendente = soma(["Pendente"]);

  return (
    <AppShell title="Financeiro" description="Seu saldo e histórico de movimentações">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="surface p-6 text-sm text-destructive">Não foi possível carregar o financeiro.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Saldo a receber" value={brl(aReceber)} icon={Wallet} highlight hint="Bonificações já aprovadas" />
            <StatCard label="Total recebido" value={brl(recebido)} icon={ArrowDownLeft} />
            <StatCard label="Total pendente" value={brl(pendente)} icon={Clock} hint="Aguardando validação" />
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Histórico de entradas (bonificações)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b bg-muted/60 text-left">
                  <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-4 py-3 font-semibold">Criada em</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Aprovação</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bonificacoes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhuma entrada registrada.
                      </td>
                    </tr>
                  ) : (
                    bonificacoes.map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3">{dataCurta(b.created_at)}</td>
                        <td className="px-4 py-3 font-semibold">{brl(b.valor)}</td>
                        <td className="px-4 py-3">{dataCurta(b.data_aprovacao)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Histórico de pagamentos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b bg-muted/60 text-left">
                  <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {movimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        Nenhum pagamento registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    movimentacoes.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3">{dataCurta(m.data)}</td>
                        <td className="px-4 py-3">{m.descricao}</td>
                        <td className="px-4 py-3">{m.categoria}</td>
                        <td className="px-4 py-3 font-semibold">{brl(m.valor)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
