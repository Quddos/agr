const CART_KEY = "agr_cart_v1";

export function getCart() {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

export function setCart(cart) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.items.find((i) => i.productId === product._id);
  if (existing) existing.quantity += quantity;
  else
    cart.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl || "",
      quantity,
    });
  setCart(cart);
  return cart;
}

export function updateCartItem(productId, quantity) {
  const cart = getCart();
  cart.items = cart.items
    .map((i) => (i.productId === productId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  setCart(cart);
  return cart;
}

export function clearCart() {
  setCart({ items: [] });
}

export function cartTotals(cart) {
  const subtotal = (cart.items || []).reduce((acc, i) => acc + i.price * i.quantity, 0);
  return { subtotal, total: subtotal };
}

