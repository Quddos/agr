"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const emptyCrop = { name: "", category: "", quantity: "", unitPrice: "", notes: "" };
const emptyStatement = { type: "income", amount: "", note: "", date: "" };

export default function DashboardPage() {
  const router = useRouter();
  const [crops, setCrops] = useState([]);
  const [statements, setStatements] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [cropForm, setCropForm] = useState(emptyCrop);
  const [statementForm, setStatementForm] = useState(emptyStatement);
  const [busy, setBusy] = useState(false);

  const cropInventoryValue = useMemo(
    () => crops.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [crops]
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("ags_token") || "" : "";
  const user =
    typeof window !== "undefined" && localStorage.getItem("ags_user")
      ? JSON.parse(localStorage.getItem("ags_user"))
      : null;

  const refreshData = useCallback(async (authToken = token) => {
    try {
      const requests = [
        fetch("/api/crops", { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json()),
        fetch("/api/statements", { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json()),
      ];
      if (user?.role === "admin" || user?.role === "manager") {
        requests.push(
          fetch("/api/users", { headers: { Authorization: `Bearer ${authToken}` } }).then((r) => r.json())
        );
      }

      const [cropRes, statementRes, userRes] = await Promise.all(requests);
      setCrops(cropRes.data || []);
      setStatements(statementRes.data || []);
      setSummary(statementRes.summary || { income: 0, expense: 0, net: 0 });
      setUsers(userRes?.data || []);
    } catch {
      localStorage.clear();
      router.push("/");
    }
  }, [router, token, user?.role]);

  useEffect(() => {
    if (token && user) {
      queueMicrotask(() => {
        refreshData(token);
      });
    }
  }, [refreshData, token, user]);

  useEffect(() => {
    if (!token || !user) {
      router.push("/");
    }
  }, [router, token, user]);

  async function apiRequest(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed.");
    return data;
  }

  async function handleAddCrop(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/api/crops", { method: "POST", body: JSON.stringify(cropForm) });
      setCropForm(emptyCrop);
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCrop(id) {
    if (!confirm("Delete this crop record?")) return;
    setBusy(true);
    try {
      await apiRequest(`/api/crops/${id}`, { method: "DELETE" });
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddStatement(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiRequest("/api/statements", { method: "POST", body: JSON.stringify(statementForm) });
      setStatementForm(emptyStatement);
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteStatement(id) {
    if (!confirm("Delete this statement record?")) return;
    setBusy(true);
    try {
      await apiRequest(`/api/statements/${id}`, { method: "DELETE" });
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function updateUserRole(id, role) {
    setBusy(true);
    try {
      await updateUserRoleRequest(token, id, role);
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.clear();
    router.push("/");
  }

  if (!token || !user) {
    return <main className="p-6 text-center">Redirecting...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow">
        <div>
          <h1 className="text-2xl font-bold">Farm Dashboard</h1>
          <p className="text-sm text-zinc-600">
            {user?.name} ({user?.role})
          </p>
        </div>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-white" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Crops" value={crops.length} />
        <MetricCard label="Inventory Value" value={`$${cropInventoryValue.toFixed(2)}`} />
        <MetricCard label="Income" value={`$${summary.income.toFixed(2)}`} />
        <MetricCard label="Net Balance" value={`$${summary.net.toFixed(2)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Crop CRUD">
          <form className="mb-4 grid gap-3" onSubmit={handleAddCrop}>
            <input className="input" placeholder="Crop name" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} required />
            <input className="input" placeholder="Category" value={cropForm.category} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" min="0" placeholder="Quantity" value={cropForm.quantity} onChange={(e) => setCropForm({ ...cropForm, quantity: e.target.value })} required />
              <input className="input" type="number" min="0" placeholder="Unit price" value={cropForm.unitPrice} onChange={(e) => setCropForm({ ...cropForm, unitPrice: e.target.value })} required />
            </div>
            <textarea className="input min-h-20" placeholder="Notes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} />
            <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" disabled={busy}>
              Add Crop
            </button>
          </form>

          <div className="space-y-2">
            {crops.map((item) => (
              <div key={item._id} className="flex items-start justify-between rounded-md border border-zinc-200 p-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-zinc-600">
                    {item.category || "General"} | Qty: {item.quantity} | ${item.unitPrice}
                  </p>
                </div>
                {(user?.role === "admin" || user?.role === "manager") && (
                  <button className="text-sm text-red-600" onClick={() => handleDeleteCrop(item._id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Statement Management">
          <form className="mb-4 grid gap-3" onSubmit={handleAddStatement}>
            <select className="input" value={statementForm.type} onChange={(e) => setStatementForm({ ...statementForm, type: e.target.value })}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input className="input" type="number" min="0" placeholder="Amount" value={statementForm.amount} onChange={(e) => setStatementForm({ ...statementForm, amount: e.target.value })} required />
            <input className="input" type="date" value={statementForm.date} onChange={(e) => setStatementForm({ ...statementForm, date: e.target.value })} />
            <textarea className="input min-h-20" placeholder="Note" value={statementForm.note} onChange={(e) => setStatementForm({ ...statementForm, note: e.target.value })} />
            <button className="rounded-md bg-indigo-700 px-4 py-2 font-semibold text-white" disabled={busy}>
              Add Statement
            </button>
          </form>

          <div className="space-y-2">
            {statements.map((item) => (
              <div key={item._id} className="flex items-start justify-between rounded-md border border-zinc-200 p-3">
                <div>
                  <p className={`font-semibold ${item.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                    {item.type.toUpperCase()} - ${item.amount}
                  </p>
                  <p className="text-sm text-zinc-600">{item.note || "No note"}</p>
                </div>
                {(user?.role === "admin" || user?.role === "manager") && (
                  <button className="text-sm text-red-600" onClick={() => handleDeleteStatement(item._id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {(user?.role === "admin" || user?.role === "manager") && (
        <section className="mt-6">
          <Card title="Role Management">
            <div className="space-y-2">
              {users.map((member) => (
                <div key={member._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 p-3">
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-zinc-600">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm">{member.role}</span>
                    {user?.role === "admin" && (
                      <select
                        className="input w-auto"
                        value={member.role}
                        onChange={(e) => updateUserRole(member._id, e.target.value)}
                      >
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="staff">staff</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </main>
  );
}

async function updateUserRoleRequest(token, id, role) {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Role update failed.");
  return data;
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-zinc-500">{label}</p>
      <h3 className="mt-2 text-2xl font-bold">{value}</h3>
    </article>
  );
}
