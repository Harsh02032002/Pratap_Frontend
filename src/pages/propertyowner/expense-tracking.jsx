import React, { useState, useEffect } from "react";
import PropertyOwnerLayout from "../../components/propertyowner/PropertyOwnerLayout";
import { getOwnerRuntimeSession, clearOwnerRuntimeSession } from "../../utils/propertyowner";
import { apiFetch } from "../../utils/api";
import { Plus, Search, TrendingDown, IndianRupee, Tag, Trash2, RefreshCw } from "lucide-react";

export default function ExpenseTracking() {
  const owner = getOwnerRuntimeSession();
  if (!owner?.loginId && typeof window !== "undefined") {
    window.location.href = "/propertyowner/ownerlogin";
    return null;
  }

  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Maintenance");
  const [newAmount, setNewAmount] = useState("");
  const [newPaid, setNewPaid] = useState("Cash");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const q = propertyFilter !== "all" ? `?propertyId=${encodeURIComponent(propertyFilter)}` : "";
      const res = await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/expenses${q}`
      );
      setExpenses(Array.isArray(res?.expenses) ? res.expenses : []);
      if (Array.isArray(res?.properties)) {
        setProperties(res.properties);
        if (!newPropertyId && res.properties[0]?._id) {
          setNewPropertyId(res.properties[0]._id);
        }
      }
    } catch (_) {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [propertyFilter]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;
    try {
      setSaving(true);
      await apiFetch(`/api/owner-analytics/${encodeURIComponent(owner.loginId)}/expenses`, {
        method: "POST",
        body: {
          propertyId: newPropertyId || undefined,
          category: newCategory,
          description: newDesc,
          amount: parseFloat(newAmount),
          paymentMethod: newPaid,
          expenseDate: newDate
        }
      });
      setNewDesc("");
      setNewAmount("");
      setShowAddModal(false);
      await fetchExpenses();
    } catch (err) {
      alert(err?.body?.message || err?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await apiFetch(
        `/api/owner-analytics/${encodeURIComponent(owner.loginId)}/expenses/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      await fetchExpenses();
    } catch (_) {}
  };

  const filtered = expenses.filter(
    (e) =>
      !search ||
      String(e.description || "").toLowerCase().includes(search.toLowerCase()) ||
      String(e.category || "").toLowerCase().includes(search.toLowerCase()) ||
      String(e.propertyName || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <PropertyOwnerLayout
      owner={owner}
      title="Expense Ledger"
      onLogout={() => {
        clearOwnerRuntimeSession();
        window.location.href = "/propertyowner/ownerlogin";
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-[38px] md:text-[44px] leading-[1.05] text-foreground">
            Expenses
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Track all property repairs, staff payrolls, utilities, and daily operations costs.
          </p>
        </div>
        <div className="flex items-center gap-2 md:mt-2">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-[13px] font-medium hover:opacity-90"
          >
            <Plus className="size-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-rose-50/50 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] text-muted-foreground font-medium">Total Outflow</span>
            <TrendingDown className="size-4 text-rose-500" />
          </div>
          <div className="font-serif text-[28px] font-bold text-rose-600">
            ₹{total.toLocaleString("en-IN")}
          </div>
          <div className="text-[11.5px] text-muted-foreground mt-1">
            {filtered.length} recorded expense entries
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] text-muted-foreground font-medium">Daily Outflow Avg</span>
            <IndianRupee className="size-4 text-muted-foreground" />
          </div>
          <div className="font-serif text-[28px] font-bold text-foreground">
            ₹{Math.round(total / 30).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12.5px] text-muted-foreground font-medium">
              Largest Billing Outflow
            </span>
            <IndianRupee className="size-4 text-muted-foreground" />
          </div>
          <div className="font-serif text-[28px] font-bold text-foreground">
            ₹
            {filtered.length > 0
              ? Math.max(...filtered.map((e) => Number(e.amount || 0))).toLocaleString("en-IN")
              : "0"}
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search expense by description, property, or category..."
          className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading expense records…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No expenses recorded yet. Click <strong>Add Expense</strong> to log property costs.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold">Property</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Mode</th>
                <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {filtered.map((e) => (
                <tr key={e._id} className="hover:bg-secondary/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">{e.description}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{e.propertyName || "General"}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      <Tag className="size-3" /> {e.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {e.expenseDate
                      ? new Date(e.expenseDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric"
                        })
                      : "-"}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">{e.paymentMethod}</td>
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                    -₹{Number(e.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(e._id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-serif text-xl font-bold mb-4">Record New Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Property</label>
                <select
                  value={newPropertyId}
                  onChange={(e) => setNewPropertyId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  <option value="">General / All Properties</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  <option>Maintenance</option>
                  <option>Electricity</option>
                  <option>Water</option>
                  <option>Cleaning</option>
                  <option>Internet</option>
                  <option>Salary</option>
                  <option>Repairs</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Electric wire repair Room 102"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={newPaid}
                  onChange={(e) => setNewPaid(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-medium"
                >
                  {saving ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PropertyOwnerLayout>
  );
}
