import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface flex flex-col gap-3 p-5",
        highlight && "border-primary/50 bg-primary/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        {Icon ? (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              highlight ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="font-display text-2xl leading-none font-bold sm:text-3xl">{value}</div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
