import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="ECO INDICA"
      className={cn("h-14 w-auto object-contain", className)}
    />
  );
}
