"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addToCart, getCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";

export default function ProductDetailsPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setCartCount(getCart().items.length);
      fetch("/api/products")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const found = (data?.data || []).find((p) => p._id === params.id);
          setProduct(found || null);
        })
        .catch(() => {});
    });
  }, [params.id]);

  if (!product) {
    return <main className="p-6 text-center text-zinc-600">Loading product...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/">
          <Button variant="outline">Back to shop</Button>
        </Link>
        <Link href="/cart">
          <Button variant="outline">Cart ({cartCount})</Button>
        </Link>
      </header>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-0 lg:grid-cols-2">
          <Image
            src={product.imageUrl || "/demo/crop-demo.svg"}
            alt={product.name}
            width={1200}
            height={900}
            className="h-full w-full object-cover"
          />
          <div className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-2xl">{product.name}</CardTitle>
              </CardHeader>
              <Badge className="bg-zinc-100 text-zinc-800">{product.category || "General"}</Badge>
            </div>
            <p className="text-zinc-600">{product.description || "Farm product."}</p>
            <p className="text-3xl font-extrabold text-emerald-800">{formatINR(product.price)}</p>
            <p className="text-sm text-zinc-600">{product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}</p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart(product, 1);
                  setCartCount(getCart().items.length);
                }}
              >
                Add to cart
              </Button>
              <Link href={`/checkout?buyNow=${product._id}`}>
                <Button disabled={product.stock <= 0}>Buy now</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

