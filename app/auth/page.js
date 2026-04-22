"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const initialRegister = { name: "", email: "", password: "", role: "staff" };
const initialLogin = { email: "", password: "" };

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) router.push("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  async function submitForm(endpoint, payload) {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "Request failed.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4 sm:p-8">
      <section className="grid w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg lg:grid-cols-2">
        <aside className="bg-emerald-700 p-8 text-white">
          <p className="mb-3 text-sm text-emerald-100">Welcome Back</p>
          <h1 className="text-3xl font-bold">Agric Management System</h1>
          <p className="mt-4 text-emerald-100">
            Securely access crop management, statement analysis, and role-based operations.
          </p>
          <Link href="/" className="mt-6 inline-block rounded-md border border-emerald-200 px-4 py-2 text-sm">
            Back to landing page
          </Link>
        </aside>

        <div className="p-6 sm:p-10">
          <div className="mb-6 flex gap-2 rounded-lg bg-zinc-100 p-1">
            <button className={`w-full rounded-md px-4 py-2 text-sm font-semibold ${tab === "login" ? "bg-white shadow-sm" : ""}`} onClick={() => setTab("login")}>
              Login
            </button>
            <button className={`w-full rounded-md px-4 py-2 text-sm font-semibold ${tab === "register" ? "bg-white shadow-sm" : ""}`} onClick={() => setTab("register")}>
              Register
            </button>
          </div>

          {tab === "login" ? (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitForm("/api/auth/login", loginForm); }}>
              <input className="input" type="email" placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
              <button className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800" type="submit" disabled={loading}>
                {loading ? "Processing..." : "Login"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitForm("/api/auth/register", registerForm); }}>
              <input className="input" placeholder="Full Name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
              <select className="input" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <button className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800" type="submit" disabled={loading}>
                {loading ? "Processing..." : "Create Account"}
              </button>
            </form>
          )}

          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
