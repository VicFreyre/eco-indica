import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { STATUS_BONIFICACAO, STATUS_EMPRESA, STATUS_PESQUISADOR } from "@/lib/domain";
import { nomeIndicacao, type Indicacao } from "@/lib/types";

export function AdminIndicacaoPainel({
  indicacao,
  onOpenChange,
}: {
  indicacao: Indicacao | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [bonifStatus, setBonifStatus] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [contatos, setContatos] = useState("");
  const [proposta, setProposta] = useState("");
  const [negociacao, setNegociacao] = useState("");
  const [fechamento, setFechamento] = useState("");
  const [dataFechamento, setDataFechamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    if (!indicacao) return;
    const o = indicacao.oportunidades_comerciais?.[0];
    const b = indicacao.bonificacoes?.[0];
    setStatus(indicacao.status);
    setBonifStatus(b?.status ?? "Pendente");
    setResponsavel(o?.responsavel_nome ?? "");
    setContatos(o?.contatos ?? "");
    setProposta(o?.proposta ?? "");
    setNegociacao(o?.negociacao ?? "");
    setFechamento(o?.fechamento ?? "");
    setDataFechamento(o?.data_fechamento ?? "");
    setObservacoes(o?.observacoes ?? "");
  }, [indicacao]);

  if (!indicacao) return null;
  const opcoesStatus = indicacao.tipo === "pesquisador" ? STATUS_PESQUISADOR : STATUS_EMPRESA;
  const bonificacao = indicacao.bonificacoes?.[0];

  async function salvar() {
    if (!indicacao) return;
    setConfirmar(false);
    setSalvando(true);
    try {
      if (status !== indicacao.status) {
        const { error } = await supabase.from("indicacoes").update({ status }).eq("id", indicacao.id);
        if (error) throw error;
      }

      if (indicacao.tipo === "empresa") {
        const payload = {
          indicacao_id: indicacao.id,
          status,
          responsavel_nome: responsavel.trim() || null,
          contatos: contatos.trim() || null,
          proposta: proposta.trim() || null,
          negociacao: negociacao.trim() || null,
          fechamento: fechamento.trim() || null,
          data_fechamento: dataFechamento || null,
          observacoes: observacoes.trim() || null,
        };
        const existente = indicacao.oportunidades_comerciais?.[0];
        const { error } = existente
          ? await supabase.from("oportunidades_comerciais").update(payload).eq("id", existente.id)
          : await supabase.from("oportunidades_comerciais").insert(payload);
        if (error) throw error;
      }

      if (bonificacao && bonifStatus !== bonificacao.status) {
        const patch: Record<string, string | null> = { status: bonifStatus };
        if (bonifStatus === "Aprovada") patch["data_aprovacao"] = new Date().toISOString();
        if (bonifStatus === "Paga") {
          patch["data_pagamento"] = new Date().toISOString();
          if (!bonificacao.data_aprovacao) patch["data_aprovacao"] = new Date().toISOString();
        }
        const { error } = await supabase.from("bonificacoes").update(patch).eq("id", bonificacao.id);
        if (error) throw error;
      }

      if (observacoes.trim()) {
        await supabase.from("historico_indicacoes").insert({
          indicacao_id: indicacao.id,
          status_anterior: indicacao.status,
          status_novo: status,
          observacao: observacoes.trim(),
        });
      }

      await qc.invalidateQueries();
      toast.success("Indicação atualizada.");
      onOpenChange(false);
    } catch (err) {
      toast.error("Não foi possível salvar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Dialog open={Boolean(indicacao)} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Gerenciar — {nomeIndicacao(indicacao)}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status da indicação</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {opcoesStatus.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {indicacao.tipo === "empresa" && (
              <>
                <div className="space-y-1.5">
                  <Label>Responsável comercial</Label>
                  <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label>Registro de contatos</Label>
                  <Textarea rows={2} value={contatos} onChange={(e) => setContatos(e.target.value)} maxLength={1000} />
                </div>
                <div className="space-y-1.5">
                  <Label>Proposta</Label>
                  <Textarea rows={2} value={proposta} onChange={(e) => setProposta(e.target.value)} maxLength={1000} />
                </div>
                <div className="space-y-1.5">
                  <Label>Negociação</Label>
                  <Textarea rows={2} value={negociacao} onChange={(e) => setNegociacao(e.target.value)} maxLength={1000} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Fechamento</Label>
                    <Input value={fechamento} onChange={(e) => setFechamento(e.target.value)} maxLength={200} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de fechamento</Label>
                    <Input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {bonificacao && (
              <div className="space-y-1.5">
                <Label>Status da bonificação</Label>
                <Select value={bonifStatus} onValueChange={setBonifStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_BONIFICACAO.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {indicacao.tipo === "empresa" && status !== "Fechada" && bonifStatus !== "Pendente" && (
                  <p className="text-xs text-destructive">
                    Bonificação de empresa só deve ser aprovada após o fechamento confirmado.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Observações (registradas no histórico)</Label>
              <Textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} maxLength={1000} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => setConfirmar(true)} disabled={salvando}>
              {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              As mudanças de status geram histórico e notificam o indicador. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={salvar}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
