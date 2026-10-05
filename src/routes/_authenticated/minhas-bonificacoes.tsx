import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Coins, BadgeCheck, Wallet, Clock, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, dataCurta } from "@/lib/domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDICACAO_SELECT, nomeIndicacao, type Bonificacao, type Indicacao } from "@/lib/types";

const STATUS_BONIFICACAO = ["Pendente", "Aprovada", "Pagamento programado", "Paga"];

export const Route = createFileRoute("/_authenticated/minhas-bonificacoes")({
  head: () => ({
    meta: [
      { title: "Bonificações — ECO INDICA" },
      {
        name: "description",
        content: "Acompanhe valores e status das bonificações por indicação.",
      },
      { property: "og:title", content: "Bonificações — ECO INDICA" },
      {
        property: "og:description",
        content: "Acompanhe valores e status das bonificações por indicação.",
      },
    ],
  }),
  component: MinhasBonificacoes,
});

function MinhasBonificacoes() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["bonificacoes", isAdmin ? "admin" : user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const select = isAdmin
        ? `${INDICACAO_SELECT}, profiles(id,nome_completo,email)`
        : INDICACAO_SELECT;
      let indicacoesQuery = supabase
        .from("indicacoes")
        .select(select)
        .order("data_registro", { ascending: false });
      let bonificacoesQuery = supabase.from("bonificacoes").select("*");
      if (!isAdmin) {
        indicacoesQuery = indicacoesQuery.eq("indicador_id", user!.id);
        bonificacoesQuery = bonificacoesQuery.eq("indicador_id", user!.id);
      }
      const [indicacoesResult, bonificacoesResult] = await Promise.all([
        indicacoesQuery,
        bonificacoesQuery.order("created_at", { ascending: false }),
      ]);
      if (indicacoesResult.error) throw indicacoesResult.error;
      if (bonificacoesResult.error) throw bonificacoesResult.error;
      return {
        indicacoes: (indicacoesResult.data ?? []) as unknown as Indicacao[],
        bonificacoes: (bonificacoesResult.data ?? []) as Bonificacao[],
      };
    },
  });

  const bonificacoesPorIndicacao = new Map(
    (data?.bonificacoes ?? []).map((bonificacao) => [bonificacao.indicacao_id, bonificacao]),
  );
  const linhas = (data?.indicacoes ?? [])
    .map((indicacao) => ({
      indicacao,
      bonificacao: bonificacoesPorIndicacao.get(indicacao.id),
    }))
    .filter((linha): linha is { indicacao: Indicacao; bonificacao: Bonificacao } =>
      Boolean(linha.bonificacao),
    );

  const soma = (fn: (l: (typeof linhas)[number]) => boolean) =>
    linhas.filter(fn).reduce((t, l) => t + Number(l.bonificacao.valor), 0);

  async function atualizarStatus(bonificacao: Bonificacao, status: string) {
    setSalvandoId(bonificacao.id);
    const patch: {
      status: string;
      data_aprovacao?: string;
      data_pagamento?: string;
    } = { status };
    const agora = new Date().toISOString();
    if (status === "Aprovada") patch.data_aprovacao = agora;
    if (status === "Paga") {
      patch.data_pagamento = agora;
      if (!bonificacao.data_aprovacao) patch.data_aprovacao = agora;
    }

    try {
      const { error } = await supabase.from("bonificacoes").update(patch).eq("id", bonificacao.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["bonificacoes"] });
      toast.success("Status da bonificação atualizado.");
    } catch (err) {
      toast.error("Não foi possível atualizar o status.", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setSalvandoId(null);
    }
  }

  return (
    <AppShell
      title="Bonificações"
      description={
        isAdmin
          ? "Acompanhe e atualize as bonificações das indicações"
          : "Valores e status das suas indicações"
      }
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="surface p-6 text-sm text-destructive">
          Não foi possível carregar as bonificações.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total acumulado"
              value={brl(soma(() => true))}
              icon={Coins}
              highlight
            />
            <StatCard
              label="Total aprovado"
              value={brl(
                soma((l) => ["Aprovada", "Pagamento programado"].includes(l.bonificacao.status)),
              )}
              icon={BadgeCheck}
            />
            <StatCard
              label="Total pago"
              value={brl(soma((l) => l.bonificacao.status === "Paga"))}
              icon={Wallet}
            />
            <StatCard
              label="Total pendente"
              value={brl(soma((l) => l.bonificacao.status === "Pendente"))}
              icon={Clock}
            />
            <StatCard
              label="Bonificações de pesquisadores"
              value={brl(soma((l) => l.indicacao.tipo === "pesquisador"))}
              icon={Users}
            />
            <StatCard
              label="Bonificações de empresas"
              value={brl(soma((l) => l.indicacao.tipo === "empresa"))}
              icon={Building2}
            />
          </div>

          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/60 text-left">
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Indicação</th>
                  {isAdmin && <th className="px-4 py-3 font-semibold">Indicador</th>}
                  <th className="px-4 py-3 font-semibold">Status da indicação</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Aprovação</th>
                  <th className="px-4 py-3 font-semibold">Pagamento</th>
                  <th className="px-4 py-3 font-semibold">Status da bonificação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linhas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 9 : 8}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {isAdmin
                        ? "Nenhuma bonificação registrada."
                        : "Você ainda não possui bonificações registradas."}
                    </td>
                  </tr>
                ) : (
                  linhas.map(({ indicacao, bonificacao }) => (
                    <tr key={bonificacao.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {dataCurta(indicacao.data_registro)}
                      </td>
                      <td className="px-4 py-3">
                        {indicacao.tipo === "pesquisador" ? "Pesquisador" : "Empresa"}
                      </td>
                      <td className="px-4 py-3 font-medium">{nomeIndicacao(indicacao)}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">{indicacao.profiles?.nome_completo ?? "—"}</td>
                      )}
                      <td className="px-4 py-3">
                        <StatusBadge status={indicacao.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold">{brl(bonificacao.valor)}</td>
                      <td className="px-4 py-3">{dataCurta(bonificacao.data_aprovacao)}</td>
                      <td className="px-4 py-3">{dataCurta(bonificacao.data_pagamento)}</td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <Select
                            value={bonificacao.status}
                            onValueChange={(status) => void atualizarStatus(bonificacao, status)}
                            disabled={salvandoId === bonificacao.id}
                          >
                            <SelectTrigger className="min-w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_BONIFICACAO.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <StatusBadge status={bonificacao.status} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
