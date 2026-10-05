import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  brl,
  errorMessage,
  ESTADOS,
  isValidCNPJ,
  maskCNPJ,
  maskTelefone,
  onlyDigits,
} from "@/lib/domain";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/_authenticated/indicar-empresa")({
  head: () => ({
    meta: [
      { title: "Indicar Empresa — ECO INDICA" },
      {
        name: "description",
        content: "Indique uma empresa para o Instituto Experiência do Cliente.",
      },
      { property: "og:title", content: "Indicar Empresa — ECO INDICA" },
      {
        property: "og:description",
        content: "Indique uma empresa e acompanhe sua bonificação após o fechamento.",
      },
    ],
  }),
  component: IndicarEmpresa,
});

const vazio = {
  nome_empresa: "",
  cnpj: "",
  segmento: "",
  cidade: "",
  estado: "",
  site_instagram: "",
  unidades: "",
  responsavel_nome: "",
  responsavel_cargo: "",
  telefone: "",
  email: "",
  como_conhece: "",
  solucao_interesse: "",
  observacoes: "",
};

function IndicarEmpresa() {
  const { user } = useAuth();
  const { data: config, isLoading: configLoading, error: configError } = useBonificacaoConfig();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(vazio);
  const [possuiContato, setPossuiContato] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const aviso = config
    ? `Enviar uma indicação não garante automaticamente a bonificação. A bonificação de ${brl(config.valorEmpresa)} será devida somente após a validação da indicação e a confirmação de contratação de um projeto ou serviço do IEC.`
    : "Enviar uma indicação não garante automaticamente a bonificação. O valor configurado será devido somente após a validação da indicação e a confirmação de contratação de um projeto ou serviço do IEC.";

  function set<K extends keyof typeof vazio>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validar() {
    if (form.nome_empresa.trim().length < 2) return "Informe o nome da empresa.";
    if (!isValidCNPJ(form.cnpj)) return "CNPJ inválido.";
    if (form.segmento.trim().length < 2) return "Informe o segmento.";
    if (form.cidade.trim().length < 2) return "Informe a cidade.";
    if (!form.estado) return "Selecione o estado.";
    if (form.responsavel_nome.trim().length < 3) return "Informe o nome do responsável.";
    if (onlyDigits(form.telefone).length < 10) return "Telefone inválido.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "E-mail inválido.";
    if (form.unidades && Number(form.unidades) < 0) return "Número de unidades inválido.";
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
        .insert({ indicador_id: user!.id, tipo: "empresa", status: "Nova" })
        .select("id")
        .single();
      if (error) throw error;

      const { error: e2 } = await supabase.from("indicacao_empresa").insert({
        indicacao_id: indicacao.id,
        nome_empresa: form.nome_empresa.trim(),
        cnpj: form.cnpj,
        segmento: form.segmento.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado,
        site_instagram: form.site_instagram.trim() || null,
        unidades: form.unidades ? Number(form.unidades) : null,
        responsavel_nome: form.responsavel_nome.trim(),
        responsavel_cargo: form.responsavel_cargo.trim() || null,
        telefone: form.telefone,
        email: form.email.trim().toLowerCase(),
        possui_contato: possuiContato,
        como_conhece: form.como_conhece.trim() || null,
        solucao_interesse: form.solucao_interesse.trim() || null,
        observacoes: form.observacoes.trim() || null,
      });
      if (e2) throw e2;

      await qc.invalidateQueries();
      toast.success("Indicação enviada!", { description: aviso, duration: 10000 });
      void navigate({ to: "/minhas-indicacoes" });
    } catch (err) {
      setErro(errorMessage(err, "Não foi possível registrar a indicação."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppShell
      title="Indicar Empresa"
      description={
        config
          ? `Bonificação de ${brl(config.valorEmpresa)} após fechamento confirmado`
          : "Bonificação após fechamento confirmado"
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
            <Label htmlFor="empresa">Nome da empresa *</Label>
            <Input
              id="empresa"
              value={form.nome_empresa}
              onChange={(e) => set("nome_empresa", e.target.value)}
              maxLength={140}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={form.cnpj}
              onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="segmento">Segmento *</Label>
            <Input
              id="segmento"
              value={form.segmento}
              onChange={(e) => set("segmento", e.target.value)}
              maxLength={80}
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
          <div className="space-y-1.5">
            <Label htmlFor="site">Site / Instagram</Label>
            <Input
              id="site"
              value={form.site_instagram}
              onChange={(e) => set("site_instagram", e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unid">Número de unidades</Label>
            <Input
              id="unid"
              type="number"
              min={0}
              value={form.unidades}
              onChange={(e) => set("unidades", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="resp">Nome do responsável *</Label>
            <Input
              id="resp"
              value={form.responsavel_nome}
              onChange={(e) => set("responsavel_nome", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={form.responsavel_cargo}
              onChange={(e) => set("responsavel_cargo", e.target.value)}
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

          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 sm:col-span-2">
            <div>
              <Label htmlFor="contato">Já possui contato com a empresa?</Label>
              <p className="text-xs text-muted-foreground">
                {possuiContato ? "Sim, tenho contato direto" : "Não tenho contato direto"}
              </p>
            </div>
            <Switch id="contato" checked={possuiContato} onCheckedChange={setPossuiContato} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="conhece">Como conhece a empresa?</Label>
            <Textarea
              id="conhece"
              rows={3}
              value={form.como_conhece}
              onChange={(e) => set("como_conhece", e.target.value)}
              maxLength={600}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="solucao">Qual solução acredita que a empresa poderia contratar?</Label>
            <Textarea
              id="solucao"
              rows={3}
              value={form.solucao_interesse}
              onChange={(e) => set("solucao_interesse", e.target.value)}
              maxLength={600}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={3}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{aviso}</p>
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
          Enviar indicação
        </Button>
      </form>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar indicação de empresa?</AlertDialogTitle>
            <AlertDialogDescription>{aviso}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={enviar}>Confirmar envio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
