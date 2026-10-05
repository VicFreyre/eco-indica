import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BONIFICACAO_CONFIG_QUERY_KEY = ["configuracoes-bonificacao"];

export function useBonificacaoConfig(enabled = true) {
  return useQuery({
    queryKey: BONIFICACAO_CONFIG_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_bonificacao")
        .select("valor_pesquisador, valor_empresa")
        .eq("id", 1)
        .single();
      if (error) throw error;

      return {
        valorPesquisador: Number(data.valor_pesquisador),
        valorEmpresa: Number(data.valor_empresa),
      };
    },
  });
}
