"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const AI_THRESHOLD = 75;
const emptyCrop = {
  name: "",
  category: "",
  quantity: "",
  unitPrice: "",
  notes: "",
  imageUrl: "",
  detectionLabel: "",
  detectionRawLabel: "",
  detectionConfidence: 0,
  detectionStatus: "unreviewed",
};
const emptyStatement = { type: "income", amount: "", note: "", date: "", crop: "" };
const emptyUser = { name: "", email: "", password: "", role: "staff" };

const cropMap = [
  { keywords: ["corn", "maize"], label: "Maize" },
  { keywords: ["wheat"], label: "Wheat" },
  { keywords: ["tomato"], label: "Tomato" },
  { keywords: ["banana"], label: "Banana" },
  { keywords: ["potato"], label: "Potato" },
  { keywords: ["rice"], label: "Rice" },
];

export default function DashboardPage() {
  const router = useRouter();
  const modelRef = useRef(null);
  const [user, setUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [statements, setStatements] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [cropForm, setCropForm] = useState(emptyCrop);
  const [statementForm, setStatementForm] = useState(emptyStatement);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingCrop, setEditingCrop] = useState(null);
  const [editingStatement, setEditingStatement] = useState(null);
  const [cropQuery, setCropQuery] = useState("");
  const [statementTypeFilter, setStatementTypeFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = user?.role === "admin" || user?.role === "manager";
  const canManageUsers = canDelete;
  const canChangeRole = user?.role === "admin";
  const canCreateUsers = user?.role === "admin";

  const filteredCrops = useMemo(
    () => crops.filter((item) => `${item.name} ${item.category} ${item.notes}`.toLowerCase().includes(cropQuery.toLowerCase())),
    [crops, cropQuery]
  );
  const filteredStatements = useMemo(
    () => statements.filter((item) => (statementTypeFilter === "all" ? true : item.type === statementTypeFilter)),
    [statements, statementTypeFilter]
  );
  const cropInventoryValue = useMemo(() => crops.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0), [crops]);
  const lowStockCrops = useMemo(() => crops.filter((crop) => Number(crop.quantity) < 100), [crops]);
  const pendingReviewCrops = useMemo(() => crops.filter((crop) => crop.detectionStatus === "needs_review"), [crops]);

  const apiRequest = useCallback(async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed.");
    return data;
  }, []);

  const refreshData = useCallback(async () => {
    const currentUser = await fetch("/api/auth/me").then(async (res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    });
    setUser(currentUser.user);

    const requests = [fetch("/api/crops").then((r) => r.json()), fetch("/api/statements").then((r) => r.json())];
    if (currentUser.user.role === "admin" || currentUser.user.role === "manager") requests.push(fetch("/api/users").then((r) => r.json()));
    const [cropRes, statementRes, userRes] = await Promise.all(requests);

    setCrops(cropRes.data || []);
    setStatements(statementRes.data || []);
    setSummary(statementRes.summary || { income: 0, expense: 0, net: 0 });
    setUsers(userRes?.data || []);
  }, []);

  useEffect(() => {
    queueMicrotask(() => refreshData().catch(() => router.push("/auth")));
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

  async function loadDetectionModel() {
    if (modelRef.current) return modelRef.current;
    const mobilenet = await import("@tensorflow-models/mobilenet");
    await import("@tensorflow/tfjs");
    modelRef.current = await mobilenet.load();
    return modelRef.current;
  }

  function mapCropLabel(rawLabel) {
    const lower = rawLabel.toLowerCase();
    const mapped = cropMap.find((item) => item.keywords.some((keyword) => lower.includes(keyword)));
    return mapped ? mapped.label : "Unknown crop class";
  }

  async function detectCrop(setTarget, imageUrl) {
    if (!imageUrl) return setErrorMessage("Upload image before AI detection.");
    setBusy(true);
    setErrorMessage("");
    try {
      const model = await loadDetectionModel();
      const img = document.createElement("img");
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const predictions = await model.classify(img);
      const best = predictions?.[0];
      if (!best) throw new Error("No prediction generated.");
      const confidence = Number((best.probability * 100).toFixed(2));
      const mappedLabel = mapCropLabel(best.className);
      const status = confidence >= AI_THRESHOLD && mappedLabel !== "Unknown crop class" ? "accepted" : "needs_review";
      setTarget((prev) => ({
        ...prev,
        detectionLabel: mappedLabel,
        detectionRawLabel: best.className,
        detectionConfidence: confidence,
        detectionStatus: status,
        notes: prev.notes
          ? `${prev.notes}\nAI: ${mappedLabel} (${confidence}%)`
          : `AI: ${mappedLabel} (${confidence}%)`,
      }));
    } catch {
      setErrorMessage("AI detection failed. Try another image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleImagePick(event, setTarget) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setTarget((prev) => ({ ...prev, imageUrl: String(reader.result || "") }));
    reader.readAsDataURL(file);
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
      await apiRequest(`/api/crops/${editingCrop._id}`, { method: "PUT", body: JSON.stringify(editingCrop) });
      setEditingCrop(null);
    });
  }

  async function handleDeleteCrop(id) {
    if (!confirm("Delete this crop?")) return;
    await runAction(() => apiRequest(`/api/crops/${id}`, { method: "DELETE" }));
  }

  async function markCropReview(id, status) {
    const crop = crops.find((item) => item._id === id);
    if (!crop) return;
    await runAction(() => apiRequest(`/api/crops/${id}`, { method: "PUT", body: JSON.stringify({ ...crop, detectionStatus: status }) }));
  }

  async function handleAddStatement(e) {
    e.preventDefault();
    await runAction(async () => {
      await apiRequest("/api/statements", { method: "POST", body: JSON.stringify({ ...statementForm, crop: statementForm.crop || null }) });
      setStatementForm(emptyStatement);
    });
  }

  async function handleUpdateStatement(e) {
    e.preventDefault();
    if (!editingStatement?._id) return;
    await runAction(async () => {
      await apiRequest(`/api/statements/${editingStatement._id}`, { method: "PUT", body: JSON.stringify(editingStatement) });
      setEditingStatement(null);
    });
  }

  async function handleDeleteStatement(id) {
    if (!confirm("Delete this statement?")) return;
    await runAction(() => apiRequest(`/api/statements/${id}`, { method: "DELETE" }));
  }

  async function updateUserRole(id, role) {
    await runAction(() => apiRequest(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) }));
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    await runAction(async () => {
      await apiRequest("/api/users", { method: "POST", body: JSON.stringify(userForm) });
      setUserForm(emptyUser);
    });
  }

  function exportStatementsCsv() {
    if (filteredStatements.length === 0) return;
    const rows = [
      ["Type", "Amount", "Date", "Crop", "Note"],
      ...filteredStatements.map((item) => [item.type, item.amount, formatDateValue(item.date), item.crop?.name || "", (item.note || "").replaceAll(",", ";")]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "statements.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  }

  if (!user) return <main className="p-6 text-center text-zinc-600">Loading dashboard...</main>;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Agric Dashboard</h1>
          <p className="text-sm text-zinc-600">{user.name} ({user.role})</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportStatementsCsv}>Export CSV</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </motion.header>

      {errorMessage ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Crops" value={crops.length} />
        <MetricCard label="Inventory Value" value={`$${cropInventoryValue.toFixed(2)}`} />
        <MetricCard label="Income" value={`$${summary.income.toFixed(2)}`} />
        <MetricCard label="Net Balance" value={`$${summary.net.toFixed(2)}`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader><CardContent>{lowStockCrops.length ? lowStockCrops.map((crop) => <p key={crop._id} className="text-sm text-amber-700">{crop.name}: {crop.quantity} units</p>) : <p className="text-sm text-zinc-600">No low-stock records.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>AI Review Queue</CardTitle></CardHeader><CardContent>{pendingReviewCrops.length ? pendingReviewCrops.map((crop) => <div key={crop._id} className="mb-2 rounded-md bg-amber-50 p-2 text-sm"><p className="font-medium">{crop.name}</p><p className="text-zinc-600">{crop.detectionLabel || crop.detectionRawLabel} ({crop.detectionConfidence || 0}%)</p><div className="mt-2 flex gap-2"><Button size="sm" onClick={() => markCropReview(crop._id, "accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => markCropReview(crop._id, "needs_review")}>Keep Review</Button></div></div>) : <p className="text-sm text-zinc-600">No pending review items.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Health</CardTitle></CardHeader><CardContent><p className="text-sm text-zinc-600">Deployment monitor endpoint: <code>/api/health</code></p></CardContent></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Crop CRUD + AI Detection</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={handleAddCrop}>
              <Input placeholder="Crop name" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} required />
              <Input placeholder="Category" value={cropForm.category} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min="0" placeholder="Quantity" value={cropForm.quantity} onChange={(e) => setCropForm({ ...cropForm, quantity: e.target.value })} required />
                <Input type="number" min="0" placeholder="Unit price" value={cropForm.unitPrice} onChange={(e) => setCropForm({ ...cropForm, unitPrice: e.target.value })} required />
              </div>
              <Textarea placeholder="Notes" value={cropForm.notes} onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })} />
              <Input type="file" accept="image/*" capture="environment" onChange={(e) => handleImagePick(e, setCropForm)} />
              {cropForm.imageUrl ? <Image src={cropForm.imageUrl} alt="Crop preview" width={96} height={96} unoptimized className="rounded-lg object-cover" /> : null}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => detectCrop(setCropForm, cropForm.imageUrl)} disabled={busy}>Detect Crop (Phase 2.1)</Button>
                <Button type="submit" disabled={busy}>Add Crop</Button>
              </div>
              {cropForm.detectionLabel ? (
                <div className="text-sm">
                  <Badge>{cropForm.detectionStatus}</Badge>
                  <p className="mt-1 text-zinc-700">Mapped: {cropForm.detectionLabel} | Raw: {cropForm.detectionRawLabel} | {cropForm.detectionConfidence}%</p>
                </div>
              ) : null}
            </form>

            <Input placeholder="Search crops..." value={cropQuery} onChange={(e) => setCropQuery(e.target.value)} />
            <div className="space-y-2">
              {filteredCrops.map((item) => (
                <div key={item._id} className="flex items-start justify-between rounded-md border border-zinc-200 p-2">
                  <div className="flex items-center gap-2">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} width={52} height={52} unoptimized className="rounded-md object-cover" /> : null}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-zinc-600">{item.category} | Qty: {item.quantity} | ${item.unitPrice}</p>
                      {item.detectionStatus ? <Badge className="mt-1">{item.detectionStatus}</Badge> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingCrop({ ...item })}>Edit</Button>
                    {canDelete ? <Button size="sm" variant="danger" onClick={() => handleDeleteCrop(item._id)}>Delete</Button> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statement Management</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={handleAddStatement}>
              <Select value={statementForm.type} onChange={(e) => setStatementForm({ ...statementForm, type: e.target.value })}><option value="income">Income</option><option value="expense">Expense</option></Select>
              <Input type="number" min="0" placeholder="Amount" value={statementForm.amount} onChange={(e) => setStatementForm({ ...statementForm, amount: e.target.value })} required />
              <Input type="date" value={statementForm.date} onChange={(e) => setStatementForm({ ...statementForm, date: e.target.value })} />
              <Select value={statementForm.crop} onChange={(e) => setStatementForm({ ...statementForm, crop: e.target.value })}>
                <option value="">Select crop (optional)</option>
                {crops.map((crop) => <option key={crop._id} value={crop._id}>{crop.name}</option>)}
              </Select>
              <Textarea placeholder="Note" value={statementForm.note} onChange={(e) => setStatementForm({ ...statementForm, note: e.target.value })} />
              <Button type="submit" disabled={busy}>Add Statement</Button>
            </form>

            <Select value={statementTypeFilter} onChange={(e) => setStatementTypeFilter(e.target.value)}>
              <option value="all">All</option><option value="income">Income</option><option value="expense">Expense</option>
            </Select>
            {filteredStatements.map((item) => (
              <div key={item._id} className="flex items-start justify-between rounded-md border border-zinc-200 p-2">
                <div>
                  <p className={`font-medium ${item.type === "income" ? "text-emerald-700" : "text-red-700"}`}>{item.type.toUpperCase()} - ${item.amount}</p>
                  <p className="text-xs text-zinc-600">{item.note || "No note"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingStatement({ ...item, crop: item.crop?._id || "" })}>Edit</Button>
                  {canDelete ? <Button size="sm" variant="danger" onClick={() => handleDeleteStatement(item._id)}>Delete</Button> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {canManageUsers ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Role Management</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {users.map((member) => (
                <div key={member._id} className="flex items-center justify-between rounded-md border border-zinc-200 p-2">
                  <div><p className="font-medium">{member.name}</p><p className="text-xs text-zinc-600">{member.email}</p></div>
                  <div className="flex items-center gap-2">
                    <Badge>{member.role}</Badge>
                    {canChangeRole ? (
                      <Select className="w-28" value={member.role} onChange={(e) => updateUserRole(member._id, e.target.value)}>
                        <option value="admin">admin</option><option value="manager">manager</option><option value="staff">staff</option>
                      </Select>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {canCreateUsers ? (
            <Card>
              <CardHeader><CardTitle>Create User (Admin)</CardTitle></CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleCreateUser}>
                  <Input placeholder="Name" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
                  <Input type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                  <Input type="password" placeholder="Temporary password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
                  <Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="staff">staff</option><option value="manager">manager</option><option value="admin">admin</option>
                  </Select>
                  <Button type="submit" disabled={busy}>Create User</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      {editingCrop ? (
        <EditModal title="Edit Crop" onCancel={() => setEditingCrop(null)} onSubmit={handleUpdateCrop} busy={busy}>
          <Input placeholder="Crop name" value={editingCrop.name} onChange={(e) => setEditingCrop({ ...editingCrop, name: e.target.value })} required />
          <Input placeholder="Category" value={editingCrop.category} onChange={(e) => setEditingCrop({ ...editingCrop, category: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" min="0" value={editingCrop.quantity} onChange={(e) => setEditingCrop({ ...editingCrop, quantity: e.target.value })} required />
            <Input type="number" min="0" value={editingCrop.unitPrice} onChange={(e) => setEditingCrop({ ...editingCrop, unitPrice: e.target.value })} required />
          </div>
          <Textarea value={editingCrop.notes || ""} onChange={(e) => setEditingCrop({ ...editingCrop, notes: e.target.value })} />
          <Input type="file" accept="image/*" capture="environment" onChange={(e) => handleImagePick(e, setEditingCrop)} />
          <Button type="button" variant="outline" onClick={() => detectCrop(setEditingCrop, editingCrop.imageUrl)} disabled={busy}>Detect Crop</Button>
        </EditModal>
      ) : null}

      {editingStatement ? (
        <EditModal title="Edit Statement" onCancel={() => setEditingStatement(null)} onSubmit={handleUpdateStatement} busy={busy}>
          <Select value={editingStatement.type} onChange={(e) => setEditingStatement({ ...editingStatement, type: e.target.value })}><option value="income">Income</option><option value="expense">Expense</option></Select>
          <Input type="number" min="0" value={editingStatement.amount} onChange={(e) => setEditingStatement({ ...editingStatement, amount: e.target.value })} required />
          <Input type="date" value={formatDateValue(editingStatement.date)} onChange={(e) => setEditingStatement({ ...editingStatement, date: e.target.value })} />
          <Select value={editingStatement.crop || ""} onChange={(e) => setEditingStatement({ ...editingStatement, crop: e.target.value })}>
            <option value="">Select crop (optional)</option>
            {crops.map((crop) => <option key={crop._id} value={crop._id}>{crop.name}</option>)}
          </Select>
          <Textarea value={editingStatement.note || ""} onChange={(e) => setEditingStatement({ ...editingStatement, note: e.target.value })} />
        </EditModal>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card><CardContent><p className="text-sm text-zinc-500">{label}</p><h3 className="mt-2 text-2xl font-bold">{value}</h3></CardContent></Card>
    </motion.article>
  );
}

function EditModal({ title, children, onCancel, onSubmit, busy }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <form className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl" onSubmit={onSubmit}>
        <h3 className="text-lg font-semibold">{title}</h3>
        {children}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={busy}>Save</Button>
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
