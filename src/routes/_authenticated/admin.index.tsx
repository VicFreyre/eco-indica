import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  ShieldAlert,
  Users,
  Building2,
  BadgeCheck,
  Wallet,
  Clock,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { IndicacaoDetalhe } from "@/components/IndicacaoDetalhe";
import { AdminIndicacaoPainel } from "@/components/AdminIndicacaoPainel";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dataCurta, STATUS_EMPRESA, STATUS_PESQUISADOR } from "@/lib/domain";
import { INDICACAO_SELECT, nomeIndicacao, type Indicacao } from "@/lib/types";
import { BONIFICACAO_CONFIG_QUERY_KEY, useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — ECO INDICA" },
      {
        name: "description",
        content: "Gestão de indicações, oportunidades e bonificações do IEC.",
      },
      { property: "og:title", content: "Painel Administrativo — ECO INDICA" },
      {
        property: "og:description",
        content: "Gestão de indicações, oportunidades e bonificações do IEC.",
      },
    ],
  }),
  component: AdminPainel,
});

const TODOS_STATUS = [...new Set([...STATUS_PESQUISADOR, ...STATUS_EMPRESA])];
const LISTA_VAZIA: Indicacao[] = [];

function AdminPainel() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useBonificacaoConfig(isAdmin);
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [indicador, setIndicador] = useState("todos");
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Indicacao | null>(null);
  const [gerenciar, setGerenciar] = useState<Indicacao | null>(null);
  const [valorPesquisador, setValorPesquisador] = useState("");
  const [valorEmpresa, setValorEmpresa] = useState("");
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  useEffect(() => {
    if (!config) return;
    setValorPesquisador(String(config.valorPesquisador));
    setValorEmpresa(String(config.valorEmpresa));
  }, [config]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "indicacoes"],
    enabled: isAdmin,
    queryFn: async () => {
      const [ind, profs] = await Promise.all([
        supabase
          .from("indicacoes")
          .select(INDICACAO_SELECT)
          .order("data_registro", { ascending: false }),
        supabase.from("profiles").select("id, nome_completo, email"),
      ]);
      if (ind.error) throw ind.error;
      if (profs.error) throw profs.error;
      const mapa = new Map((profs.data ?? []).map((p) => [p.id, p]));
      const lista = ((ind.data ?? []) as unknown as Indicacao[]).map((i) => ({
        ...i,
        profiles: mapa.get(i.indicador_id) ?? null,
      }));
      return { lista, indicadores: profs.data ?? [] };
    },
  });

  const lista = data?.lista ?? LISTA_VAZIA;

  const filtradas = useMemo(
    () =>
      lista.filter((i) => {
        if (tipo !== "todos" && i.tipo !== tipo) return false;
        if (status !== "todos" && i.status !== status) return false;
        if (indicador !== "todos" && i.indicador_id !== indicador) return false;
        if (busca) {
          const alvo = `${nomeIndicacao(i)} ${i.profiles?.nome_completo ?? ""}`.toLowerCase();
          if (!alvo.includes(busca.toLowerCase())) return false;
        }
        return true;
      }),
    [lista, tipo, status, indicador, busca],
  );

  const bonificacoes = lista.flatMap((i) => i.bonificacoes ?? []);
  const soma = (s: string[]) =>
    bonificacoes.filter((b) => s.includes(b.status)).reduce((t, b) => t + Number(b.valor), 0);

  async function salvarConfiguracao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parseValor = (valor: string) => {
      const normalizado = valor.trim().replace(",", ".");
      if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(normalizado)) return null;
      return Number(normalizado);
    };
    const pesquisador = parseValor(valorPesquisador);
    const empresa = parseValor(valorEmpresa);
    if (pesquisador === null || empresa === null) {
      toast.error("Informe valores válidos, não negativos e com até duas casas decimais.");
      return;
    }

    setSalvandoConfig(true);
    try {
      const { data: updatedConfig, error } = await supabase
        .from("configuracoes_bonificacao")
        .update({ valor_pesquisador: pesquisador, valor_empresa: empresa })
        .eq("id", 1)
        .select("id")
        .single();
      if (error) throw error;
      if (!updatedConfig) throw new Error("A configuração não foi atualizada.");
      await qc.invalidateQueries({ queryKey: BONIFICACAO_CONFIG_QUERY_KEY });
      toast.success("Valores de bonificação atualizados.");
    } catch (err) {
      toast.error("Não foi possível salvar os valores.", {
        description: err instanceof Error ? err.message : "Tente novamente.",
      });
    } finally {
      setSalvandoConfig(false);
    }
  }

  async function aprovarBonificacao(i: Indicacao) {
    const b = i.bonificacoes?.[0];
    if (!b) return;
    const { error } = await supabase
      .from("bonificacoes")
      .update({ status: "Aprovada", data_aprovacao: new Date().toISOString() })
      .eq("id", b.id);
    if (error) {
      toast.error("Erro ao aprovar", { description: error.message });
      return;
    }
    toast.success("Bonificação aprovada.");
    void qc.invalidateQueries();
  }

  if (loading) {
    return (
      <AppShell title="Painel Administrativo">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Painel Administrativo">
        <div className="surface mx-auto max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Acesso restrito</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área é exclusiva para administradores do IEC.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Painel Administrativo" description="Gestão completa das indicações">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="surface p-6 text-sm text-destructive">Não foi possível carregar os dados.</p>
      ) : (
        <div className="space-y-6">
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
              label="Empresas fechadas"
              value={lista.filter((i) => i.status === "Fechada").length}
              icon={BadgeCheck}
            />
            <StatCard label="Bonificações pendentes" value={brl(soma(["Pendente"]))} icon={Clock} />
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
          </div>

          <section className="surface p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Settings2 className="size-5 text-primary" />
              <div>
                <h2 className="font-semibold">Valores das bonificações</h2>
                <p className="text-sm text-muted-foreground">
                  Os valores configurados serão usados nas novas indicações.
                </p>
              </div>
            </div>
            {configLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Carregando configuração...
              </div>
            ) : configError ? (
              <p className="text-sm text-destructive">
                Não foi possível carregar a configuração. Verifique se o schema atualizado foi
                executado no Supabase.
              </p>
            ) : (
              <form
                onSubmit={salvarConfiguracao}
                className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              >
                <div className="space-y-1.5">
                  <label htmlFor="valor-pesquisador" className="text-sm font-medium">
                    Pesquisador (R$)
                  </label>
                  <Input
                    id="valor-pesquisador"
                    type="text"
                    inputMode="decimal"
                    value={valorPesquisador}
                    onChange={(e) => setValorPesquisador(e.target.value)}
                    required
                    aria-label="Valor da bonificação por pesquisador"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="valor-empresa" className="text-sm font-medium">
                    Empresa (R$)
                  </label>
                  <Input
                    id="valor-empresa"
                    type="text"
                    inputMode="decimal"
                    value={valorEmpresa}
                    onChange={(e) => setValorEmpresa(e.target.value)}
                    required
                    aria-label="Valor da bonificação por empresa"
                  />
                </div>
                <Button type="submit" disabled={salvandoConfig}>
                  {salvandoConfig && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Salvar valores
                </Button>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  As bonificações já registradas mantêm o valor original; a alteração vale para as
                  próximas indicações.
                </p>
              </form>
            )}
          </section>

          <div className="surface flex flex-col gap-3 p-4 lg:flex-row">
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
              <SelectTrigger className="lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="pesquisador">Pesquisador</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="lg:w-52">
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
            <Select value={indicador} onValueChange={setIndicador}>
              <SelectTrigger className="lg:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os indicadores</SelectItem>
                {(data?.indicadores ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="todas">
            <TabsList>
              <TabsTrigger value="todas">Todas as indicações</TabsTrigger>
              <TabsTrigger value="analises">Análises</TabsTrigger>
              <TabsTrigger value="crm">CRM de empresas</TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="mt-4">
              <div className="surface overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b bg-muted/60 text-left">
                    <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Indicação</th>
                      <th className="px-4 py-3 font-semibold">Indicador</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Bonificação</th>
                      <th className="px-4 py-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          Nenhuma indicação encontrada.
                        </td>
                      </tr>
                    ) : (
                      filtradas.map((i) => (
                        <tr key={i.id} className="hover:bg-muted/40">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {dataCurta(i.data_registro)}
                          </td>
                          <td className="px-4 py-3">
                            {i.tipo === "pesquisador" ? "Pesquisador" : "Empresa"}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {nomeIndicacao(i)}
                            {(i.autorreferencia || i.duplicada_de) && (
                              <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                                {i.autorreferencia ? "autorreferência" : "duplicada"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {i.profiles?.nome_completo ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={i.status} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={i.bonificacoes?.[0]?.status ?? "Pendente"} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setDetalhe(i)}>
                                Detalhes
                              </Button>
                              <Button size="sm" onClick={() => setGerenciar(i)}>
                                Gerenciar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="analises" className="mt-4">
              <AdminAnalytics indicacoes={lista} usuariosCount={data?.indicadores.length ?? 0} />
            </TabsContent>

            <TabsContent value="crm" className="mt-4">
              <div className="surface overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="border-b bg-muted/60 text-left">
                    <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Indicador</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Responsável</th>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Bonificação</th>
                      <th className="px-4 py-3 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtradas.filter((i) => i.tipo === "empresa").length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                          Nenhuma empresa indicada.
                        </td>
                      </tr>
                    ) : (
                      filtradas
                        .filter((i) => i.tipo === "empresa")
                        .map((i) => (
                          <tr key={i.id} className="hover:bg-muted/40">
                            <td className="px-4 py-3 font-medium">{nomeIndicacao(i)}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {i.profiles?.nome_completo ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={i.status} />
                            </td>
                            <td className="px-4 py-3">
                              {i.oportunidades_comerciais?.[0]?.responsavel_nome ?? "—"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {dataCurta(i.data_registro)}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {brl(i.bonificacoes?.[0]?.valor ?? 0)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {i.status === "Fechada" &&
                                  i.bonificacoes?.[0]?.status === "Pendente" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => aprovarBonificacao(i)}
                                    >
                                      Aprovar bônus
                                    </Button>
                                  )}
                                <Button size="sm" onClick={() => setGerenciar(i)}>
                                  Gerenciar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <IndicacaoDetalhe indicacao={detalhe} onOpenChange={(o) => !o && setDetalhe(null)} />
      <AdminIndicacaoPainel indicacao={gerenciar} onOpenChange={(o) => !o && setGerenciar(null)} />
    </AppShell>
  );
}
