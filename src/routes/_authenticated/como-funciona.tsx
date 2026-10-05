import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { STATUS_BONIFICACAO, STATUS_EMPRESA, STATUS_PESQUISADOR } from "@/lib/domain";
import { brl } from "@/lib/domain";
import { useBonificacaoConfig } from "@/lib/bonificacao";

export const Route = createFileRoute("/_authenticated/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona — ECO INDICA" },
      {
        name: "description",
        content: "Regras, etapas e valores do programa de indicações do IEC.",
      },
      { property: "og:title", content: "Como Funciona — ECO INDICA" },
      {
        property: "og:description",
        content: "Regras, etapas e valores do programa de indicações do IEC.",
      },
    ],
  }),
  component: ComoFunciona,
});

function Fluxo({ titulo, etapas }: { titulo: string; etapas: readonly string[] }) {
  return (
    <div className="surface p-5">
      <h3 className="font-semibold">{titulo}</h3>
      <ol className="mt-4 space-y-3 border-l pl-5">
        {etapas.map((e, idx) => (
          <li key={e} className="relative text-sm">
            <span className="absolute top-1 -left-[26px] grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {idx + 1}
            </span>
            {e}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ComoFunciona() {
  const { data: config, isLoading, error } = useBonificacaoConfig();

  return (
    <AppShell title="Como Funciona" description="Entenda as etapas e as regras do programa">
      <div className="space-y-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando valores de bonificação...</p>
        )}
        {error && (
          <p className="surface p-4 text-sm text-destructive">
            Não foi possível carregar os valores de bonificação configurados.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface border-primary/50 bg-primary/10 p-6">
            <p className="font-display text-3xl font-extrabold">
              {config ? brl(config.valorPesquisador) : "—"}
            </p>
            <p className="mt-1 font-semibold">Indicação de pesquisador</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Devida após a realização da pesquisa e a aprovação do relatório, conforme as regras do
              programa.
            </p>
          </div>
          <div className="surface border-primary/50 bg-primary/10 p-6">
            <p className="font-display text-3xl font-extrabold">
              {config ? brl(config.valorEmpresa) : "—"}
            </p>
            <p className="mt-1 font-semibold">Indicação de empresa</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Devida somente após a validação da indicação e a confirmação de contratação de um
              projeto ou serviço do IEC.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Fluxo titulo="Fluxo do pesquisador" etapas={STATUS_PESQUISADOR} />
          <Fluxo titulo="Fluxo da empresa" etapas={STATUS_EMPRESA} />
          <Fluxo titulo="Fluxo da bonificação" etapas={STATUS_BONIFICACAO} />
        </div>

        <div className="surface p-6">
          <h3 className="font-semibold">Regras do programa</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Toda indicação registra automaticamente data, hora e indicador responsável.</li>
            <li>• Em caso de duplicidade, vale a primeira indicação válida registrada.</li>
            <li>• Enviar uma indicação não gera bonificação automática.</li>
            <li>• Indicação, validação, bonificação e pagamento são etapas independentes.</li>
            <li>• Autoindicações são identificadas e não são elegíveis.</li>
            <li>• Empresa já cliente ou em negociação ativa não gera nova bonificação.</li>
            <li>• Você visualiza apenas as suas indicações e os seus dados financeiros.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
