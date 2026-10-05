import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidCPF, maskCPF, maskTelefone, onlyDigits } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu Perfil — ECO INDICA" },
      { name: "description", content: "Seus dados cadastrais no programa de indicações do IEC." },
      { property: "og:title", content: "Meu Perfil — ECO INDICA" },
      { property: "og:description", content: "Seus dados cadastrais no programa de indicações do IEC." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pix, setPix] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNome(profile.nome_completo);
    setCpf(maskCPF(profile.cpf));
    setTelefone(profile.telefone ?? "");
    setPix(profile.chave_pix ?? "");
  }, [profile]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (nome.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (!isValidCPF(cpf)) {
      toast.error("Informe um CPF válido.");
      return;
    }
    if (!profile) return;

    setSalvando(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome_completo: nome.trim(),
          cpf: onlyDigits(cpf),
          telefone: telefone || null,
          chave_pix: pix.trim() || null,
        })
        .eq("id", profile.id);
      if (error) {
        toast.error(
          error.code === "23505" ? "Este CPF já está cadastrado." : "Não foi possível salvar.",
          { description: error.message },
        );
        return;
      }
      await refreshProfile();
      toast.success("Dados atualizados!");
    } catch (error) {
      toast.error("Não foi possível salvar.", {
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell title="Meu Perfil" description="Seus dados cadastrais">
      <form onSubmit={salvar} className="surface mx-auto max-w-2xl space-y-5 p-5 sm:p-7">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={profile?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tel">Telefone</Label>
            <Input
              id="tel"
              value={telefone}
              onChange={(e) => setTelefone(maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pix">Chave PIX para recebimento</Label>
            <Input id="pix" value={pix} onChange={(e) => setPix(e.target.value)} maxLength={140} />
          </div>
        </div>
        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          Perfil de acesso: <strong>{isAdmin ? "Administrador" : "Indicador"}</strong>
        </div>
        <Button type="submit" className="font-semibold" disabled={salvando}>
          {salvando && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </form>
    </AppShell>
  );
}
