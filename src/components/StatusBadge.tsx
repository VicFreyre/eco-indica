import { statusTone } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tone === "positivo" && "border-success/30 bg-success/10 text-success",
        tone === "negativo" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "neutro" && "border-border bg-muted text-muted-foreground",
        tone === "andamento" && "border-primary/40 bg-primary/20 text-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "positivo" && "bg-success",
          tone === "negativo" && "bg-destructive",
          tone === "neutro" && "bg-muted-foreground",
          tone === "andamento" && "bg-primary",
        )}
      />
      {status}
    </span>
  );
}
