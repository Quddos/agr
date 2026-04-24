"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearCart, getCart, updateCartItem, cartTotals } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const [cart, setCart] = useState({ items: [] });

  useEffect(() => {
    queueMicrotask(() => {
      setCart(getCart());
    });
  }, []);

  const totals = useMemo(() => cartTotals(cart), [cart]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        <Link href="/">
          <Button variant="outline">Back to shop</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.items.length === 0 ? (
            <p className="text-zinc-600">Cart is empty.</p>
          ) : (
            cart.items.map((i) => (
              <div key={i.productId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 p-3">
                <div className="flex items-center gap-3">
                  <Image src={i.imageUrl || "/demo/crop-demo.svg"} alt={i.name} width={64} height={64} className="h-16 w-16 rounded-md object-cover" />
                  <div>
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-sm text-zinc-600">{formatINR(i.price)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-24"
                    type="number"
                    min="0"
                    value={i.quantity}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const next = updateCartItem(i.productId, Number.isNaN(qty) ? 0 : qty);
                      setCart(next);
                    }}
                  />
                  <p className="w-24 text-right font-semibold">{formatINR(i.price * i.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-zinc-600">Subtotal</p>
            <p className="font-bold">{formatINR(totals.subtotal)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-zinc-600">Total</p>
            <p className="text-xl font-extrabold">{formatINR(totals.total)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                clearCart();
                setCart(getCart());
              }}
            >
              Clear cart
            </Button>
            <Link href="/checkout">
              <Button disabled={cart.items.length === 0}>Checkout</Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-500">
            You can shop freely. Sign in/up is required only when you click Pay/Place order.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

