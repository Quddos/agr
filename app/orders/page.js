"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/money";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) {
          window.location.href = "/auth?returnTo=/orders";
          return;
        }
        setMe(data.user);
        return fetch("/api/orders").then((r) => (r.ok ? r.json() : null));
      })
      .then((data) => setOrders(data?.data || []))
      .catch(() => setMessage("Unable to load orders."));
  }, []);

  const sorted = useMemo(() => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [orders]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-4 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Shop</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </header>

      {message ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Order tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.length === 0 ? (
            <p className="text-zinc-600">No orders yet.</p>
          ) : (
            sorted.map((o) => (
              <div key={o._id} className="rounded-md border border-zinc-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order #{String(o._id).slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-zinc-600">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{o.orderStatus}</Badge>
                    <Badge className="bg-zinc-100 text-zinc-800">{o.paymentStatus}</Badge>
                    <Badge className="bg-zinc-100 text-zinc-800">{o.paymentMethod}</Badge>
                  </div>
                </div>
                <div className="mt-2 text-sm text-zinc-700">
                  <p>Total: <span className="font-bold">{formatINR(o.total)}</span></p>
                  <p>Ship to: {o.shipping?.fullName}, {o.shipping?.address}</p>
                </div>
                <div className="mt-3 space-y-1">
                  {(o.items || []).map((it, idx) => (
                    <p key={`${o._id}-${idx}`} className="text-sm text-zinc-600">
                      {it.name} × {it.quantity} — {formatINR(it.price * it.quantity)}
                    </p>
                  ))}
                </div>
                {me?.role === "admin" || me?.role === "manager" ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Admin/Manager view: this list includes more orders.
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}

