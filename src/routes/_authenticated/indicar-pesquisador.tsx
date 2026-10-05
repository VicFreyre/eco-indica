import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
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
import { brl, errorMessage, ESTADOS, maskTelefone, onlyDigits } from "@/lib/domain";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/_authenticated/indicar-pesquisador")({
  head: () => ({
    meta: [
      { title: "Indicar Pesquisador — ECO INDICA" },
      {
        name: "description",
        content: "Indique um pesquisador para o Instituto Experiência do Cliente.",
      },
      { property: "og:title", content: "Indicar Pesquisador — ECO INDICA" },
      {
        property: "og:description",
        content: "Indique um pesquisador e acompanhe sua bonificação.",
      },
    ],
  }),
  component: IndicarPesquisador,
});

const vazio = {
  nome: "",
  jornada: "",
  telefone: "",
  email: "",
  cidade: "",
  estado: "",
  observacoes: "",
};

function IndicarPesquisador() {
  const { user } = useAuth();
  const { data: config, isLoading: configLoading, error: configError } = useBonificacaoConfig();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  function set<K extends keyof typeof vazio>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validar() {
    if (form.nome.trim().length < 3) return "Informe o nome do pesquisador.";
    if (form.jornada.trim().length < 2) return "Informe o segmento.";
    if (onlyDigits(form.telefone).length < 10) return "Telefone inválido.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "E-mail inválido.";
    if (form.cidade.trim().length < 2) return "Informe a cidade.";
    if (!form.estado) return "Selecione o estado.";
    return null;
  }

  function abrirConfirmacao(e: React.FormEvent) {
    e.preventDefault();
    const v = validar();
    setErro(v);
    if (!v) setConfirmar(true);
  }

  async function enviar() {
    setConfirmar(false);
    setEnviando(true);
    setErro(null);
    try {
      const { data: indicacao, error } = await supabase
        .from("indicacoes")
        .insert({ indicador_id: user!.id, tipo: "pesquisador", status: "Indicação registrada" })
        .select("id")
        .single();
      if (error) throw error;

      const { error: e2 } = await supabase.from("indicacao_pesquisador").insert({
        indicacao_id: indicacao.id,
        nome: form.nome.trim(),
        jornada: form.jornada,
        telefone: form.telefone,
        email: form.email.trim().toLowerCase(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        observacoes: form.observacoes.trim() || null,
      });
      if (e2) throw e2;

      await qc.invalidateQueries();
      toast.success("Indicação registrada com sucesso!");
      void navigate({ to: "/minhas-indicacoes" });
    } catch (err) {
      setErro(errorMessage(err, "Não foi possível registrar a indicação."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppShell
      title="Indicar Pesquisador"
      description={
        config
          ? `Bonificação de ${brl(config.valorPesquisador)} conforme regras do programa`
          : "Bonificação conforme regras do programa"
      }
    >
      <form onSubmit={abrirConfirmacao} className="surface mx-auto max-w-3xl space-y-5 p-5 sm:p-7">
        {configLoading && (
          <p className="text-sm text-muted-foreground">Carregando valor da bonificação...</p>
        )}
        {configError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Não foi possível carregar a configuração da bonificação. Tente novamente mais tarde.
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="segmento">Segmento *</Label>
            <Input
              id="segmento"
              value={form.jornada}
              onChange={(e) => set("jornada", e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tel">Telefone *</Label>
            <Input
              id="tel"
              value={form.telefone}
              onChange={(e) => set("telefone", maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cidade">Cidade *</Label>
            <Input
              id="cidade"
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estado *</Label>
            <Select value={form.estado} onValueChange={(v) => set("estado", v)}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            A data e hora do registro e o indicador responsável são gravados automaticamente. A
            bonificação {config ? `de ${brl(config.valorPesquisador)} ` : ""}está condicionada às
            regras do programa e à aprovação do relatório.
          </p>
        </div>

        {erro && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button
          type="submit"
          className="w-full font-semibold sm:w-auto"
          disabled={enviando || configLoading || Boolean(configError) || !config}
        >
          {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
          Registrar indicação
        </Button>
      </form>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar indicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Você vai indicar <strong>{form.nome}</strong> para o segmento {form.jornada}. Após o
              envio os dados não poderão ser editados por você.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={enviar}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
