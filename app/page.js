"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  "AI-assisted crop detection with review workflow",
  "Role-based operation control across teams",
  "Financial statement tracking and CSV exports",
  "PWA-ready for mobile-first field operations",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
        <div className="flex items-center gap-2">
          <Image src="/file.svg" alt="AgricMS" width={24} height={24} />
          <h1 className="text-xl font-bold text-emerald-900">AgricMS</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-2 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Badge className="bg-emerald-100 text-emerald-900">Next-gen agriculture operations</Badge>
          <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            One platform for farm records, finance, teams, and AI insights
          </h2>
          <p className="text-lg text-zinc-600">
            Manage your agricultural operations with a modern, responsive system designed for both office and field usage.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth">
              <Button size="lg">Launch Platform</Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg">View Features</Button>
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="overflow-hidden border-emerald-100 shadow-lg">
          <CardContent className="p-3">
            <Image src="/demo/dashboard-demo.svg" alt="Dashboard preview" width={900} height={620} priority className="h-auto w-full rounded-xl" />
          </CardContent>
        </Card>
        </motion.div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <h3 className="mb-6 text-2xl font-bold text-zinc-900">Built for practical farm impact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature}>
              <CardContent>
                <p className="font-medium text-zinc-800">{feature}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-8 md:grid-cols-3">
        <Image src="/demo/crop-demo.svg" alt="Crop module" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-sm" />
        <Image src="/demo/statement-demo.svg" alt="Statement module" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-sm" />
        <Image src="/demo/mobile-demo.svg" alt="Mobile module" width={600} height={450} className="h-full w-full rounded-xl border border-zinc-200 bg-white p-2 shadow-sm" />
      </section>
    </main>
  );
}
