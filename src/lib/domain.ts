export const STATUS_PESQUISADOR = [
  "Indicação registrada",
  "Cadastro pendente",
  "Em análise",
  "Apto",
  "Selecionado",
  "Pesquisa realizada",
  "Relatório entregue",
  "Relatório aprovado",
  "Bonificação aprovada",
  "Pago",
] as const;

export const STATUS_EMPRESA = [
  "Nova",
  "Em validação",
  "Contato pendente",
  "Contatada",
  "Em negociação",
  "Fechada",
  "Perdida",
  "Duplicada",
  "Não elegível",
] as const;

export const STATUS_BONIFICACAO = ["Pendente", "Aprovada", "Pagamento programado", "Paga"] as const;

export const JORNADAS = ["Academia", "Farmácia", "Varejo"] as const;

export const ESTADOS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const NEGATIVOS = ["Perdida", "Duplicada", "Não elegível"];
const POSITIVOS = [
  "Pago",
  "Paga",
  "Fechada",
  "Relatório aprovado",
  "Bonificação aprovada",
  "Aprovada",
];
const NEUTROS = ["Indicação registrada", "Nova", "Pendente"];

export function statusTone(status: string): "positivo" | "negativo" | "neutro" | "andamento" {
  if (NEGATIVOS.includes(status)) return "negativo";
  if (POSITIVOS.includes(status)) return "positivo";
  if (NEUTROS.includes(status)) return "neutro";
  return "andamento";
}

export function brl(value: number | string | null | undefined) {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

export function dataHora(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function dataCurta(value?: string | null) {
  if (!value) return "—";
  const d = value.length <= 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  return d.toLocaleDateString("pt-BR");
}

export function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error !== "object" || error === null) return fallback;

  const result = error as Record<string, unknown>;
  const details = [result.message, result.details, result.hint]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ");
  const code = typeof result.code === "string" ? ` (${result.code})` : "";
  return details ? `${details}${code}` : fallback;
}

export function maskCPF(v: string) {
  return onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(v: string) {
  return onlyDigits(v)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskTelefone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10)
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function isValidCPF(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

export function isValidCNPJ(value: string) {
  const c = onlyDigits(value);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len: number) => {
    let pos = len - 7;
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Number(c[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}
