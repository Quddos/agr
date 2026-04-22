import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500",
        className
      )}
      {...props}
    />
  );
}
