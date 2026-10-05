import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ArrowUpRight, ArrowDownRight, Scale, Clock, BadgeCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dataCurta } from "@/lib/domain";
import type { Bonificacao, Movimentacao } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro Administrativo — ECO INDICA" },
      { name: "description", content: "Controle de entradas, saídas e bonificações do programa." },
      { property: "og:title", content: "Financeiro Administrativo — ECO INDICA" },
      { property: "og:description", content: "Controle de entradas, saídas e bonificações do programa." },
    ],
  }),
  component: AdminFinanceiro,
});

const vazio = {
  tipo: "entrada",
  categoria: "",
  descricao: "",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  status: "Pendente",
  observacoes: "",
};

function AdminFinanceiro() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "financeiro"],
    enabled: isAdmin,
    queryFn: async () => {
      const [mov, bon] = await Promise.all([
        supabase.from("movimentacoes_financeiras").select("*").order("data", { ascending: false }),
        supabase.from("bonificacoes").select("*"),
      ]);
      if (mov.error) throw mov.error;
      if (bon.error) throw bon.error;
      return {
        movimentacoes: (mov.data ?? []) as Movimentacao[],
        bonificacoes: (bon.data ?? []) as Bonificacao[],
      };
    },
  });

  const movimentacoes = data?.movimentacoes ?? [];
  const bonificacoes = data?.bonificacoes ?? [];
  const totalTipo = (t: "entrada" | "saida") =>
    movimentacoes.filter((m) => m.tipo === t).reduce((acc, m) => acc + Number(m.valor), 0);
  const somaBon = (s: string[]) =>
    bonificacoes.filter((b) => s.includes(b.status)).reduce((acc, b) => acc + Number(b.valor), 0);

  async function lancar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoria.trim() || !form.descricao.trim() || !Number(form.valor)) {
      toast.error("Preencha categoria, descrição e valor.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("movimentacoes_financeiras").insert({
      tipo: form.tipo,
      categoria: form.categoria.trim(),
      descricao: form.descricao.trim(),
      valor: Number(form.valor),
      data: form.data,
      status: form.status,
      observacoes: form.observacoes.trim() || null,
    });
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível lançar", { description: error.message });
      return;
    }
    setForm(vazio);
    toast.success("Movimentação registrada.");
    void qc.invalidateQueries({ queryKey: ["admin", "financeiro"] });
  }

  if (loading) {
    return (
      <AppShell title="Financeiro Administrativo">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Financeiro Administrativo">
        <div className="surface mx-auto max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Acesso restrito</h2>
          <p className="mt-2 text-sm text-muted-foreground">Área exclusiva para administradores.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Financeiro Administrativo" description="Entradas, saídas e saldo do programa">
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="surface p-6 text-sm text-destructive">Não foi possível carregar o financeiro.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total de entradas" value={brl(totalTipo("entrada"))} icon={ArrowUpRight} />
            <StatCard label="Total de saídas" value={brl(totalTipo("saida"))} icon={ArrowDownRight} />
            <StatCard label="Saldo financeiro" value={brl(totalTipo("entrada") - totalTipo("saida"))} icon={Scale} highlight />
            <StatCard label="Bonificações pendentes" value={brl(somaBon(["Pendente"]))} icon={Clock} />
            <StatCard label="Bonificações aprovadas" value={brl(somaBon(["Aprovada", "Pagamento programado"]))} icon={BadgeCheck} />
            <StatCard label="Bonificações pagas" value={brl(somaBon(["Paga"]))} icon={Wallet} />
          </div>

          <form onSubmit={lancar} className="surface space-y-4 p-5">
            <h2 className="font-semibold">Nova movimentação</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Pagamento programado">Pagamento programado</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} maxLength={200} />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label>Observação</Label>
                <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} maxLength={600} />
              </div>
            </div>
            <Button type="submit" className="font-semibold" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Lançar movimentação
            </Button>
          </form>

          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/60 text-left">
                <tr className="text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Descrição</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {movimentacoes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhuma movimentação registrada.</td></tr>
                ) : (
                  movimentacoes.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{dataCurta(m.data)}</td>
                      <td className="px-4 py-3">{m.tipo === "entrada" ? "Entrada" : "Saída"}</td>
                      <td className="px-4 py-3">{m.categoria}</td>
                      <td className="px-4 py-3">{m.descricao}</td>
                      <td className={m.tipo === "entrada" ? "px-4 py-3 font-semibold text-success" : "px-4 py-3 font-semibold text-destructive"}>
                        {m.tipo === "entrada" ? "+" : "−"} {brl(m.valor)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
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
