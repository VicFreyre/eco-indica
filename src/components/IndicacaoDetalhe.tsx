import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, dataCurta, dataHora } from "@/lib/domain";
import { nomeIndicacao, type Historico, type Indicacao } from "@/lib/types";

function Linha({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-sm break-words sm:text-right">{value}</span>
    </div>
  );
}

export function IndicacaoDetalhe({
  indicacao,
  onOpenChange,
}: {
  indicacao: Indicacao | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: historico = [] } = useQuery({
    queryKey: ["historico", indicacao?.id],
    enabled: Boolean(indicacao?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_indicacoes")
        .select("*")
        .eq("indicacao_id", indicacao!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Historico[];
    },
  });

  if (!indicacao) return null;
  const p = indicacao.indicacao_pesquisador?.[0];
  const e = indicacao.indicacao_empresa?.[0];
  const b = indicacao.bonificacoes?.[0];
  const o = indicacao.oportunidades_comerciais?.[0];

  return (
    <Dialog open={Boolean(indicacao)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {nomeIndicacao(indicacao)}
            <StatusBadge status={indicacao.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h3 className="mb-1 text-sm font-bold">Indicação</h3>
            <Linha label="Tipo" value={indicacao.tipo === "pesquisador" ? "Pesquisador" : "Empresa"} />
            <Linha label="Registrada em" value={dataHora(indicacao.data_registro)} />
            <Linha label="Última atualização" value={dataHora(indicacao.updated_at)} />
            {indicacao.autorreferencia && <Linha label="Alerta" value="Possível autorreferência" />}
            {indicacao.duplicada_de && <Linha label="Alerta" value="Possível duplicidade detectada" />}
            {indicacao.suspeita_fraude && <Linha label="Alerta" value="Sinalizada para verificação" />}
          </section>

          {p && (
            <section>
              <h3 className="mb-1 text-sm font-bold">Dados do pesquisador</h3>
              <Linha label="Nome" value={p.nome} />
              <Linha label="Segmento" value={p.jornada} />
              <Linha label="Telefone" value={p.telefone} />
              <Linha label="E-mail" value={p.email} />
              <Linha label="Cidade / UF" value={`${p.cidade} / ${p.estado}`} />
              <Linha label="Observações" value={p.observacoes} />
            </section>
          )}

          {e && (
            <section>
              <h3 className="mb-1 text-sm font-bold">Dados da empresa</h3>
              <Linha label="Empresa" value={e.nome_empresa} />
              <Linha label="CNPJ" value={e.cnpj} />
              <Linha label="Segmento" value={e.segmento} />
              <Linha label="Cidade / UF" value={`${e.cidade} / ${e.estado}`} />
              <Linha label="Site / Instagram" value={e.site_instagram} />
              <Linha label="Unidades" value={e.unidades ?? ""} />
              <Linha label="Responsável" value={`${e.responsavel_nome}${e.responsavel_cargo ? ` — ${e.responsavel_cargo}` : ""}`} />
              <Linha label="Telefone" value={e.telefone} />
              <Linha label="E-mail" value={e.email} />
              <Linha label="Possui contato" value={e.possui_contato ? "Sim" : "Não"} />
              <Linha label="Como conhece" value={e.como_conhece} />
              <Linha label="Solução de interesse" value={e.solucao_interesse} />
              <Linha label="Observações" value={e.observacoes} />
            </section>
          )}

          {o && (
            <section>
              <h3 className="mb-1 text-sm font-bold">Oportunidade comercial</h3>
              <Linha label="Status" value={o.status} />
              <Linha label="Responsável" value={o.responsavel_nome} />
              <Linha label="Contatos" value={o.contatos} />
              <Linha label="Proposta" value={o.proposta} />
              <Linha label="Negociação" value={o.negociacao} />
              <Linha label="Fechamento" value={o.fechamento} />
              <Linha label="Data de fechamento" value={o.data_fechamento ? dataCurta(o.data_fechamento) : ""} />
              <Linha label="Observações" value={o.observacoes} />
            </section>
          )}

          {b && (
            <section>
              <h3 className="mb-1 text-sm font-bold">Bonificação</h3>
              <Linha label="Valor" value={brl(b.valor)} />
              <Linha label="Status" value={<StatusBadge status={b.status} />} />
              <Linha label="Aprovada em" value={b.data_aprovacao ? dataHora(b.data_aprovacao) : ""} />
              <Linha label="Paga em" value={b.data_pagamento ? dataHora(b.data_pagamento) : ""} />
              <Linha label="Observações" value={b.observacoes} />
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-bold">Histórico</h3>
            {historico.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros.</p>
            ) : (
              <ol className="space-y-3 border-l pl-4">
                {historico.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium">
                      {h.status_anterior ? `${h.status_anterior} → ` : ""}
                      {h.status_novo}
                    </p>
                    {h.observacao && <p className="text-sm text-muted-foreground">{h.observacao}</p>}
                    <p className="text-xs text-muted-foreground">{dataHora(h.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
