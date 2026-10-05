export type Tipo = "pesquisador" | "empresa";

export type Pesquisador = {
  id: string;
  indicacao_id: string;
  nome: string;
  jornada: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  observacoes: string | null;
};

export type Empresa = {
  id: string;
  indicacao_id: string;
  nome_empresa: string;
  cnpj: string;
  segmento: string;
  cidade: string;
  estado: string;
  site_instagram: string | null;
  unidades: number | null;
  responsavel_nome: string;
  responsavel_cargo: string | null;
  telefone: string;
  email: string;
  possui_contato: boolean;
  como_conhece: string | null;
  solucao_interesse: string | null;
  observacoes: string | null;
};

export type Bonificacao = {
  id: string;
  indicacao_id: string;
  indicador_id: string;
  valor: number;
  status: string;
  data_aprovacao: string | null;
  data_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
};

export type Oportunidade = {
  id: string;
  indicacao_id: string;
  responsavel_id: string | null;
  responsavel_nome: string | null;
  status: string;
  contatos: string | null;
  proposta: string | null;
  negociacao: string | null;
  fechamento: string | null;
  data_fechamento: string | null;
  observacoes: string | null;
};

export type Indicacao = {
  id: string;
  indicador_id: string;
  tipo: Tipo;
  status: string;
  data_registro: string;
  validade: string | null;
  autorreferencia: boolean;
  suspeita_fraude: boolean;
  duplicada_de: string | null;
  created_at: string;
  updated_at: string;
  indicacao_pesquisador: Pesquisador[] | null;
  indicacao_empresa: Empresa[] | null;
  bonificacoes: Bonificacao[] | null;
  oportunidades_comerciais: Oportunidade[] | null;
  profiles?: { id: string; nome_completo: string; email: string } | null;
};

export type Movimentacao = {
  id: string;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  status: string;
  indicador_id: string | null;
  indicacao_id: string | null;
  observacoes: string | null;
  created_at: string;
};

export type Historico = {
  id: string;
  indicacao_id: string;
  usuario_id: string | null;
  status_anterior: string | null;
  status_novo: string | null;
  observacao: string | null;
  created_at: string;
};

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  indicacao_id: string | null;
  lida: boolean;
  created_at: string;
};

export const INDICACAO_SELECT =
  "*, indicacao_pesquisador(*), indicacao_empresa(*), bonificacoes(*), oportunidades_comerciais(*)";

export function nomeIndicacao(i: Indicacao) {
  if (i.tipo === "pesquisador") return i.indicacao_pesquisador?.[0]?.nome ?? "Pesquisador";
  return i.indicacao_empresa?.[0]?.nome_empresa ?? "Empresa";
}
