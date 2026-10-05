import { BadgeCheck, Building2, MapPin, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { STATUS_PESQUISADOR } from "@/lib/domain";
import type { Indicacao } from "@/lib/types";

type AdminAnalyticsProps = {
  indicacoes: Indicacao[];
  usuariosCount: number;
};

const STATUS_ACEITOS = new Set([
  "Apto",
  "Selecionado",
  "Pesquisa realizada",
  "Relatório entregue",
  "Relatório aprovado",
  "Bonificação aprovada",
  "Pago",
]);

function contarPor<T>(items: T[], getKey: (item: T) => string | null | undefined) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = getKey(item)?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

function Distribuicao({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const maior = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="surface p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem dados de localização.</p>
      ) : (
        <div className="space-y-3">
          {rows.slice(0, 10).map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate">{row.label}</span>
                <span className="shrink-0 font-semibold">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(row.count / maior) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminAnalytics({ indicacoes, usuariosCount }: AdminAnalyticsProps) {
  const pesquisadores = indicacoes.filter((indicacao) => indicacao.tipo === "pesquisador");
  const empresas = indicacoes.filter((indicacao) => indicacao.tipo === "empresa");
  const pesquisadoresAceitos = pesquisadores.filter((indicacao) =>
    STATUS_ACEITOS.has(indicacao.status),
  ).length;
  const empresasFechadas = empresas.filter((indicacao) => indicacao.status === "Fechada").length;

  const geografia = indicacoes.flatMap((indicacao) => {
    const pesquisador = indicacao.indicacao_pesquisador?.[0];
    const empresa = indicacao.indicacao_empresa?.[0];
    const local = indicacao.tipo === "pesquisador" ? pesquisador : empresa;
    return local ? [{ cidade: local.cidade, estado: local.estado }] : [];
  });
  const porEstado = contarPor(geografia, (local) => local.estado);
  const porCidade = contarPor(geografia, (local) =>
    local.cidade && local.estado ? `${local.cidade}, ${local.estado}` : local.cidade,
  );

  const statusPesquisadores = contarPor(pesquisadores, (indicacao) => indicacao.status);
  const statusEmpresas = contarPor(empresas, (indicacao) => indicacao.status);

  const meses = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      count: 0,
    };
  });
  const mesMap = new Map(meses.map((mes) => [mes.key, mes]));
  for (const indicacao of indicacoes) {
    const date = new Date(indicacao.data_registro);
    const month = mesMap.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (month) month.count += 1;
  }
  const maxMes = Math.max(1, ...meses.map((mes) => mes.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contas cadastradas" value={usuariosCount} icon={Users} />
        <StatCard
          label="Indicações registradas"
          value={indicacoes.length}
          icon={MapPin}
          highlight
        />
        <StatCard
          label="Aceite de pesquisadores"
          value={`${pesquisadores.length ? Math.round((pesquisadoresAceitos / pesquisadores.length) * 100) : 0}%`}
          hint={`${pesquisadoresAceitos} de ${pesquisadores.length} chegaram a “Apto” ou etapa posterior`}
          icon={BadgeCheck}
        />
        <StatCard
          label="Empresas fechadas"
          value={`${empresas.length ? Math.round((empresasFechadas / empresas.length) * 100) : 0}%`}
          hint={`${empresasFechadas} de ${empresas.length} indicações de empresa`}
          icon={Building2}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribuicao title="Indicações por estado" rows={porEstado} />
        <Distribuicao title="Indicações por cidade" rows={porCidade} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <h3 className="mb-4 font-semibold">Indicações nos últimos 6 meses</h3>
          <div className="grid h-48 grid-cols-6 items-end gap-3">
            {meses.map((mes) => (
              <div key={mes.key} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-xs font-semibold">{mes.count}</span>
                <div className="flex h-32 w-full items-end rounded-t bg-muted">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{
                      height: `${Math.max(mes.count ? 8 : 0, (mes.count / maxMes) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-center text-[11px] capitalize text-muted-foreground">
                  {mes.label}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="surface p-5">
          <h3 className="mb-4 font-semibold">Resumo por tipo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3 text-sm">
              <span>Pesquisadores</span>
              <span className="font-semibold">{pesquisadores.length}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3 text-sm">
              <span>Empresas</span>
              <span className="font-semibold">{empresas.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Total</span>
              <span className="font-semibold">{indicacoes.length}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Distribuicao title="Status das indicações de pesquisadores" rows={statusPesquisadores} />
        <Distribuicao title="Status das indicações de empresas" rows={statusEmpresas} />
      </div>
      <p className="text-xs text-muted-foreground">
        O aceite de pesquisadores considera os status: {STATUS_PESQUISADOR.slice(3).join(", ")}.
      </p>
    </div>
  );
}
