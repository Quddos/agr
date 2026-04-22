"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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
      if (!res.ok) return setMessage(data.message || "Request failed.");
      router.push("/dashboard");
    } catch {
      setMessage("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-4 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
        <Card className="grid overflow-hidden lg:grid-cols-2">
          <aside className="bg-emerald-700 p-8 text-white">
            <p className="mb-3 text-sm text-emerald-100">Welcome Back</p>
            <h1 className="text-3xl font-bold">Agric Management System</h1>
            <p className="mt-4 text-emerald-100">
              Access crop management, role administration, statements, and AI-powered crop hints.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm underline underline-offset-4">
              Back to landing page
            </Link>
          </aside>

          <div className="p-4 sm:p-8">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">Authenticate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
              <div className="flex gap-2 rounded-lg bg-zinc-100 p-1">
                <Button className="w-full" variant={tab === "login" ? "default" : "ghost"} onClick={() => setTab("login")}>
                  Login
                </Button>
                <Button className="w-full" variant={tab === "register" ? "default" : "ghost"} onClick={() => setTab("register")}>
                  Register
                </Button>
              </div>

              {tab === "login" ? (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submitForm("/api/auth/login", loginForm); }}>
                  <Input type="email" placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                  <Input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                  <Button className="w-full" type="submit" disabled={loading}>{loading ? "Processing..." : "Login"}</Button>
                </form>
              ) : (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submitForm("/api/auth/register", registerForm); }}>
                  <Input placeholder="Full Name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
                  <Input type="email" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
                  <Input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
                  <Select value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </Select>
                  <Button className="w-full" type="submit" disabled={loading}>{loading ? "Processing..." : "Create Account"}</Button>
                </form>
              )}
              {message ? <p className="text-sm text-red-600">{message}</p> : null}
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
