"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clearCart, getCart, cartTotals } from "@/lib/cart";
import { formatINR } from "@/lib/money";

const emptyShipping = { fullName: "", phone: "", address: "", city: "" };
const CHECKOUT_DRAFT_KEY = "agr_checkout_draft_v1";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState({ items: [] });
  const [shipping, setShipping] = useState(emptyShipping);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [buyNowId, setBuyNowId] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const url = new URL(window.location.href);
        const id = url.searchParams.get("buyNow");
        if (id) setBuyNowId(id);
      } catch {}

      // Load draft if user was redirected to login.
      try {
        const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          setShipping(draft.shipping || emptyShipping);
          setPaymentMethod(draft.paymentMethod || "cod");
        }
      } catch {}

      setCart(getCart());
    });
  }, [router]);

  const effectiveItems = useMemo(() => {
    if (!buyNowId) return cart.items;
    const item = cart.items.find((i) => i.productId === buyNowId);
    return item ? [item] : [];
  }, [buyNowId, cart.items]);
  const effectiveTotals = useMemo(() => cartTotals({ items: effectiveItems }), [effectiveItems]);

  async function placeOrder() {
    setBusy(true);
    setMessage("");
    try {
      // Require auth only when paying/placing order.
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        localStorage.setItem(
          CHECKOUT_DRAFT_KEY,
          JSON.stringify({ shipping, paymentMethod })
        );
        router.push("/auth?returnTo=/checkout");
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: effectiveItems,
          shipping,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Checkout failed.");
      clearCart();
      setCart(getCart());
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      setMessage("Order placed successfully. Check dashboard for sales updates.");
      router.push("/orders");
    } catch (e) {
      setMessage(e.message || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link href="/cart">
          <Button variant="outline">Back to cart</Button>
        </Link>
      </header>

      {message ? <p className="rounded-md bg-zinc-100 p-3 text-sm">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
          <Input placeholder="Phone" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
          <Input className="sm:col-span-2" placeholder="Address" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
          <Input placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cod">Cash on Delivery</option>
            <option value="online">Pay Online (demo)</option>
          </Select>
          <div className="flex items-center justify-between">
            <p className="text-zinc-600">Total</p>
            <p className="text-xl font-extrabold">{formatINR(effectiveTotals.total)}</p>
          </div>
          {paymentMethod === "online" ? (
            <Button
              variant="outline"
              type="button"
              onClick={() => setMessage("Payment button clicked (demo). You’ll be marked as paid on order placement.")}
            >
              Pay Online
            </Button>
          ) : null}
          <Button
            disabled={busy || effectiveItems.length === 0 || !shipping.fullName || !shipping.phone || !shipping.address}
            onClick={placeOrder}
          >
            Place order
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

