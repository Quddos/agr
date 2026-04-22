"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const emptyCrop = { name: "", category: "", quantity: "", unitPrice: "", notes: "", imageUrl: "" };
const emptyStatement = { type: "income", amount: "", note: "", date: "", crop: "" };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [statements, setStatements] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [cropForm, setCropForm] = useState(emptyCrop);
  const [statementForm, setStatementForm] = useState(emptyStatement);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editingStatement, setEditingStatement] = useState(null);
  const [cropQuery, setCropQuery] = useState("");
  const [statementTypeFilter, setStatementTypeFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = user?.role === "admin" || user?.role === "manager";
  const canManageUsers = canDelete;
  const canChangeRole = user?.role === "admin";

  const filteredCrops = useMemo(
    () =>
      crops.filter((item) =>
        `${item.name} ${item.category} ${item.notes}`.toLowerCase().includes(cropQuery.toLowerCase())
      ),
    [crops, cropQuery]
  );

  const filteredStatements = useMemo(
    () =>
      statements.filter((item) =>
        statementTypeFilter === "all" ? true : item.type === statementTypeFilter
      ),
    [statements, statementTypeFilter]
  );

  const cropInventoryValue = useMemo(
    () => crops.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0),
    [crops]
  );

  const apiRequest = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed.");
    return data;
  }, []);

  const refreshData = useCallback(async () => {
    const currentUser = await fetch("/api/auth/me").then(async (res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    });

    const nextUser = currentUser.user;
    setUser(nextUser);

    const requests = [fetch("/api/crops").then((r) => r.json()), fetch("/api/statements").then((r) => r.json())];
    if (nextUser.role === "admin" || nextUser.role === "manager") {
      requests.push(fetch("/api/users").then((r) => r.json()));
    }

    const [cropRes, statementRes, userRes] = await Promise.all(requests);
    setCrops(cropRes.data || []);
    setStatements(statementRes.data || []);
    setSummary(statementRes.summary || { income: 0, expense: 0, net: 0 });
    setUsers(userRes?.data || []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshData().catch(() => router.push("/"));
    });
  }, [refreshData, router]);

  async function runAction(fn) {
    setBusy(true);
    setErrorMessage("");
    try {
      await fn();
      await refreshData();
    } catch (error) {
      setErrorMessage(error.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCrop(e) {
    e.preventDefault();
    await runAction(async () => {
      await apiRequest("/api/crops", { method: "POST", body: JSON.stringify(cropForm) });
      setCropForm(emptyCrop);
    });
  }

  async function handleUpdateCrop(e) {
    e.preventDefault();
    if (!editingCrop?._id) return;
    await runAction(async () => {
      await apiRequest(`/api/crops/${editingCrop._id}`, {
        method: "PUT",
        body: JSON.stringify(editingCrop),
      });
      setEditingCrop(null);
    });
  }

  async function handleDeleteCrop(id) {
    if (!confirm("Delete this crop record?")) return;
    await runAction(() => apiRequest(`/api/crops/${id}`, { method: "DELETE" }));
  }

  async function handleAddStatement(e) {
    e.preventDefault();
    await runAction(async () => {
      await apiRequest("/api/statements", {
        method: "POST",
        body: JSON.stringify({ ...statementForm, crop: statementForm.crop || null }),
      });
      setStatementForm(emptyStatement);
    });
  }

  async function handleUpdateStatement(e) {
    e.preventDefault();
    if (!editingStatement?._id) return;
    await runAction(async () => {
      await apiRequest(`/api/statements/${editingStatement._id}`, {
        method: "PUT",
        body: JSON.stringify(editingStatement),
      });
      setEditingStatement(null);
    });
  }

  async function handleDeleteStatement(id) {
    if (!confirm("Delete this statement record?")) return;
    await runAction(() => apiRequest(`/api/statements/${id}`, { method: "DELETE" }));
  }

  async function updateUserRole(id, role) {
    await runAction(() =>
      apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) })
    );
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function handleImagePick(event, setTarget) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setTarget((prev) => ({ ...prev, imageUrl: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  if (!user) return <main className="p-6 text-center text-zinc-600">Loading dashboard...</main>;

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agric Management Dashboard</h1>
          <p className="text-sm text-zinc-600">
            Signed in as {user.name} ({user.role})
          </p>
        </div>
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-white" onClick={logout}>
          Logout
        </button>
      </header>

      {errorMessage ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Crops" value={crops.length} />
        <MetricCard label="Inventory Value" value={`$${cropInventoryValue.toFixed(2)}`} />
        <MetricCard label="Income" value={`$${summary.income.toFixed(2)}`} />
        <MetricCard label="Net Balance" value={`$${summary.net.toFixed(2)}`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title="Crop CRUD + Camera Capture">
          <form className="mb-4 grid gap-3" onSubmit={handleAddCrop}>
            <input className="input" placeholder="Crop name" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} required />
            <input className="input" placeholder="Category" value={cropForm.category} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" type="number" min="0" placeholder="Quantity" value={cropForm.quantity} onChange={(e) => setCropForm({ ...cropForm, quantity: e.target.value })} required />
              <input className="input" type="number" min="0" placeholder="Unit price" value={cropForm.unitPrice} onChange={(e) => setCropForm({ ...cropForm, unitPrice: e.target.value })} required />
            </div>
            <textarea className="input min-h-20" placeholder="Notes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} />
            <label className="text-sm text-zinc-600">Capture or upload crop image</label>
            <input className="input" type="file" accept="image/*" capture="environment" onChange={(e) => handleImagePick(e, setCropForm)} />
            {cropForm.imageUrl ? (
              <Image
                src={cropForm.imageUrl}
                alt="Crop preview"
                width={96}
                height={96}
                unoptimized
                className="h-24 w-24 rounded-lg object-cover"
              />
            ) : null}
            <button className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white" disabled={busy}>
              Add Crop
            </button>
          </form>

          <input
            className="input mb-3"
            placeholder="Search crops..."
            value={cropQuery}
            onChange={(e) => setCropQuery(e.target.value)}
          />

          <div className="space-y-2">
            {filteredCrops.map((item) => (
              <div key={item._id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-zinc-600">
                        {item.category || "General"} | Qty: {item.quantity} | ${item.unitPrice}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-blue-700" onClick={() => setEditingCrop({ ...item })}>
                      Edit
                    </button>
                    {canDelete && (
                      <button className="text-sm text-red-600" onClick={() => handleDeleteCrop(item._id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
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
            <select className="input" value={statementForm.crop} onChange={(e) => setStatementForm({ ...statementForm, crop: e.target.value })}>
              <option value="">Select crop (optional)</option>
              {crops.map((crop) => (
                <option key={crop._id} value={crop._id}>
                  {crop.name}
                </option>
              ))}
            </select>
            <textarea className="input min-h-20" placeholder="Note" value={statementForm.note} onChange={(e) => setStatementForm({ ...statementForm, note: e.target.value })} />
            <button className="rounded-md bg-indigo-700 px-4 py-2 font-semibold text-white" disabled={busy}>
              Add Statement
            </button>
          </form>

          <select
            className="input mb-3"
            value={statementTypeFilter}
            onChange={(e) => setStatementTypeFilter(e.target.value)}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <div className="space-y-2">
            {filteredStatements.map((item) => (
              <div key={item._id} className="flex items-start justify-between rounded-md border border-zinc-200 p-3">
                <div>
                  <p className={`font-semibold ${item.type === "income" ? "text-emerald-700" : "text-red-700"}`}>
                    {item.type.toUpperCase()} - ${item.amount}
                  </p>
                  <p className="text-sm text-zinc-600">{item.note || "No note"}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm text-blue-700" onClick={() => setEditingStatement({ ...item, crop: item.crop?._id || "" })}>
                    Edit
                  </button>
                  {canDelete && (
                    <button className="text-sm text-red-600" onClick={() => handleDeleteStatement(item._id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {canManageUsers && (
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
                    {canChangeRole && (
                      <select className="input w-auto" value={member.role} onChange={(e) => updateUserRole(member._id, e.target.value)}>
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

      {editingCrop ? (
        <EditModal
          title="Edit Crop"
          onCancel={() => setEditingCrop(null)}
          onSubmit={handleUpdateCrop}
          busy={busy}
        >
          <input className="input" placeholder="Crop name" value={editingCrop.name} onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })} required />
          <input className="input" placeholder="Category" value={editingCrop.category} onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" type="number" min="0" placeholder="Quantity" value={editingCrop.quantity} onChange={(e) => setEditingCrop({ ...editingCrop, quantity: e.target.value })} required />
            <input className="input" type="number" min="0" placeholder="Unit price" value={editingCrop.unitPrice} onChange={(e) => setEditingCrop({ ...editingCrop, unitPrice: e.target.value })} required />
          </div>
          <textarea className="input min-h-20" placeholder="Notes" value={editingCrop.notes || ""} onChange={(e) => setEditingCrop({ ...editingCrop, notes: e.target.value })} />
          <input className="input" type="file" accept="image/*" capture="environment" onChange={(e) => handleImagePick(e, setEditingCrop)} />
        </EditModal>
      ) : null}

      {editingStatement ? (
        <EditModal
          title="Edit Statement"
          onCancel={() => setEditingStatement(null)}
          onSubmit={handleUpdateStatement}
          busy={busy}
        >
          <select className="input" value={editingStatement.type} onChange={(e) => setEditingStatement({ ...editingStatement, type: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input className="input" type="number" min="0" value={editingStatement.amount} onChange={(e) => setEditingStatement({ ...editingStatement, amount: e.target.value })} required />
          <input className="input" type="date" value={formatDateValue(editingStatement.date)} onChange={(e) => setEditingStatement({ ...editingStatement, date: e.target.value })} />
          <select className="input" value={editingStatement.crop || ""} onChange={(e) => setEditingStatement({ ...editingStatement, crop: e.target.value })}>
            <option value="">Select crop (optional)</option>
            {crops.map((crop) => (
              <option key={crop._id} value={crop._id}>
                {crop.name}
              </option>
            ))}
          </select>
          <textarea className="input min-h-20" value={editingStatement.note || ""} onChange={(e) => setEditingStatement({ ...editingStatement, note: e.target.value })} />
        </EditModal>
      ) : null}
    </main>
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

function Card({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function EditModal({ title, children, onCancel, onSubmit, busy }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl" onSubmit={onSubmit}>
        <h3 className="text-lg font-semibold">{title}</h3>
        {children}
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-zinc-300 px-4 py-2" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-white" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function formatDateValue(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
