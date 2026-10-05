import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { dataHora } from "@/lib/domain";
import type { Notificacao } from "@/lib/types";

export function NotificationBell({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["notificacoes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as Notificacao[];
    },
    refetchInterval: 60000,
  });

  const naoLidas = data.filter((n) => !n.lida).length;

  async function marcarTodas() {
    await supabase.from("notificacoes").update({ lida: true }).eq("user_id", userId).eq("lida", false);
    void qc.invalidateQueries({ queryKey: ["notificacoes"] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-4" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <button onClick={marcarTodas} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              Marcar como lidas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {data.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação por enquanto.
            </p>
          ) : (
            data.map((n) => (
              <div key={n.id} className="border-b px-4 py-3 last:border-0">
                <div className="flex items-start gap-2">
                  {!n.lida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{n.titulo}</p>
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{dataHora(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
