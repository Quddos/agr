import Image from "next/image";
import Link from "next/link";

const features = [
  "Role-based operations for admin, manager and staff",
  "Crop inventory with camera capture and AI-assisted detection",
  "Income and expense statement management with live net balance",
  "PWA-ready deployment for mobile and desktop usage",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
        <h1 className="text-xl font-bold text-emerald-800">AgricMS</h1>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="rounded-md border border-emerald-700 px-4 py-2 text-emerald-700">
            Login
          </Link>
          <Link href="/auth" className="rounded-md bg-emerald-700 px-4 py-2 text-white">
            Get Started
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:py-16">
        <div className="space-y-6">
          <p className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
            Smart Agriculture Management Platform
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Grow faster with data-driven farm operations
          </h2>
          <p className="text-lg text-zinc-600">
            Manage crops, users, statements, and field records from one modern dashboard. Built for teams and
            optimized for mobile.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth" className="rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white">
              Launch Dashboard
            </Link>
            <a href="#features" className="rounded-md border border-zinc-300 px-5 py-3 font-semibold text-zinc-700">
              Explore Features
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
          <Image src="/demo/dashboard-demo.svg" alt="Dashboard preview" width={900} height={620} priority className="h-auto w-full rounded-xl" />
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <h3 className="mb-6 text-2xl font-bold">Why teams pick AgricMS</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="font-medium text-zinc-800">{feature}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-8 md:grid-cols-3">
        <Image src="/demo/crop-demo.svg" alt="Crop demo" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm" />
        <Image src="/demo/statement-demo.svg" alt="Statement demo" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm" />
        <Image src="/demo/mobile-demo.svg" alt="Mobile demo" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm" />
      </section>
    </main>
  );
}
