import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { IndicacaoDetalhe } from "@/components/IndicacaoDetalhe";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dataCurta, STATUS_EMPRESA, STATUS_PESQUISADOR } from "@/lib/domain";
import { INDICACAO_SELECT, nomeIndicacao, type Indicacao } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/minhas-indicacoes")({
  head: () => ({
    meta: [
      { title: "Minhas Indicações — ECO INDICA" },
      { name: "description", content: "Histórico completo das suas indicações e seus status." },
      { property: "og:title", content: "Minhas Indicações — ECO INDICA" },
      { property: "og:description", content: "Histórico completo das suas indicações e seus status." },
    ],
  }),
  component: MinhasIndicacoes,
});

const TODOS_STATUS = [...new Set([...STATUS_PESQUISADOR, ...STATUS_EMPRESA])];

function MinhasIndicacoes() {
  const { user } = useAuth();
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Indicacao | null>(null);

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

  const filtradas = useMemo(() => {
    return (data ?? []).filter((i) => {
      if (tipo !== "todos" && i.tipo !== tipo) return false;
      if (status !== "todos" && i.status !== status) return false;
      if (busca && !nomeIndicacao(i).toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [data, tipo, status, busca]);

  return (
    <AppShell title="Minhas Indicações" description="Acompanhe o status de cada indicação enviada">
      <div className="space-y-4">
        <div className="surface flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome"
              className="pl-9"
            />
          </div>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="pesquisador">Pesquisador</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {TODOS_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="surface p-6 text-sm text-destructive">Não foi possível carregar as indicações.</p>
        ) : filtradas.length === 0 ? (
          <p className="surface p-10 text-center text-sm text-muted-foreground">
            Nenhuma indicação encontrada com esses filtros.
          </p>
        ) : (
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/60 text-left">
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Nome da indicação</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Bonificação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtradas.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => setSelecionada(i)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{dataCurta(i.data_registro)}</td>
                    <td className="px-4 py-3">{i.tipo === "pesquisador" ? "Pesquisador" : "Empresa"}</td>
                    <td className="px-4 py-3 font-medium">{nomeIndicacao(i)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      {brl(i.bonificacoes?.[0]?.valor ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <IndicacaoDetalhe indicacao={selecionada} onOpenChange={(o) => !o && setSelecionada(null)} />
    </AppShell>
  );
}
