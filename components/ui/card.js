import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("rounded-2xl border border-zinc-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-3", className)} {...props} />;
}
