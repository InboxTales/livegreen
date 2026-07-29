import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, Check, Tag, IndianRupee, ChevronDown, Search, Filter, Upload, TrendingUp, TrendingDown } from "lucide-react";
import { fetchAuth } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExpenseCategory {
  id: number;
  name: string;
  expense_group: string;
  expense_type: "Fixed" | "Variable";
  description?: string;
  is_active: number;
}

interface Expense {
  id: number;
  expense_date: string;
  category_id: number;
  category_name: string;
  expense_group: string;
  expense_type: string;
  amount: string;
  payment_method: string;
  description: string;
  vendor?: string;
  bill_url?: string;
  notes?: string;
}

const EXPENSE_GROUPS = ["Inventory", "Logistics", "Marketing", "Technology", "Operations", "Salaries", "Rent & Utilities", "Other"];
const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Cheque", "Other"];

const GROUP_COLORS: Record<string, string> = {
  Inventory: "bg-amber-100 text-amber-800",
  Logistics: "bg-blue-100 text-blue-800",
  Marketing: "bg-purple-100 text-purple-800",
  Technology: "bg-cyan-100 text-cyan-800",
  Operations: "bg-orange-100 text-orange-800",
  Salaries: "bg-rose-100 text-rose-800",
  "Rent & Utilities": "bg-lime-100 text-lime-700",
  Other: "bg-gray-100 text-gray-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${className}`}>{label}</span>
  );
}

function fmt(amount: string | number) {
  return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ─── Category Form Modal ──────────────────────────────────────────────────────

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category?: ExpenseCategory;
  onClose: () => void;
  onSave: (cat: ExpenseCategory) => void;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? "",
    expense_group: category?.expense_group ?? EXPENSE_GROUPS[0],
    expense_type: category?.expense_type ?? "Variable",
    description: category?.description ?? "",
    is_active: category?.is_active ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = category ? `/api/expense-categories/${category.id}` : "/api/expense-categories";
      const method = category ? "PUT" : "POST";
      const data = await fetchAuth(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSave(data.category);
    } catch (err: any) {
      setError(err.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{category ? "Edit Category" : "New Category"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g. Packaging"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Group *</label>
              <select
                required
                value={form.expense_group}
                onChange={e => setForm(f => ({ ...f, expense_group: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
              >
                {EXPENSE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
              <select
                required
                value={form.expense_type}
                onChange={e => setForm(f => ({ ...f, expense_type: e.target.value as any }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
              >
                <option value="Fixed">Fixed</option>
                <option value="Variable">Variable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              rows={2}
              placeholder="Short description..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: f.is_active === 1 ? 0 : 1 }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active === 1 ? "bg-green-600" : "bg-gray-200"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.is_active === 1 ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-gray-600">{form.is_active === 1 ? "Active" : "Inactive"}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#1B5E20] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#144a18] transition-colors disabled:opacity-60">
              {saving ? "Saving..." : category ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────

function ExpenseModal({
  expense,
  categories,
  onClose,
  onSave,
}: {
  expense?: Expense;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSave: (exp: Expense) => void;
}) {
  const activeCategories = categories.filter(c => c.is_active === 1);
  const initialCategoryId = expense?.category_id ?? (activeCategories[0]?.id ?? 0);
  const [form, setForm] = useState({
    expense_date: expense?.expense_date ?? new Date().toISOString().split("T")[0],
    category_id: initialCategoryId,
    amount: expense?.amount ?? "",
    payment_method: expense?.payment_method ?? PAYMENT_METHODS[0],
    description: expense?.description ?? "",
    vendor: expense?.vendor ?? "",
    notes: expense?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCategory = categories.find(c => c.id === Number(form.category_id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = expense ? "PUT" : "POST";
      const data = await fetchAuth(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, category_id: Number(form.category_id) }) });
      onSave(data.expense);
    } catch (err: any) {
      setError(err.message ?? "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{expense ? "Edit Expense" : "Add Expense"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                required
                type="date"
                value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              required
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
            >
              {activeCategories.length === 0 && <option value="">No active categories</option>}
              {activeCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {/* Auto-filled info */}
            {selectedCategory && (
              <div className="mt-2 flex gap-2">
                <Badge label={selectedCategory.expense_group} className={GROUP_COLORS[selectedCategory.expense_group] ?? "bg-gray-100 text-gray-700"} />
                <Badge
                  label={selectedCategory.expense_type}
                  className={selectedCategory.expense_type === "Fixed" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}
                />
                <span className="text-[11px] text-gray-400 mt-0.5">auto-filled</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
              required
              value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
            >
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Purpose / Description *</label>
            <textarea
              required
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              rows={2}
              placeholder="What was this expense for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor (Optional)</label>
            <input
              value={form.vendor}
              onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="e.g. Amazon, Local Supplier..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#1B5E20] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#144a18] transition-colors disabled:opacity-60">
              {saving ? "Saving..." : expense ? "Save Changes" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Categories Sub-Tab ───────────────────────────────────────────────────────

function CategoriesSubTab() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | undefined>();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAuth("/api/expense-categories").then(data => { setCategories(data); setLoading(false); });
  }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.expense_group.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (cat: ExpenseCategory) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      return idx >= 0 ? prev.map(c => c.id === cat.id ? cat : c) : [cat, ...prev];
    });
    setModalOpen(false);
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setError("");
    try {
      await fetchAuth(`/api/expense-categories/${id}`, { method: "DELETE" });
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (cat: ExpenseCategory) => {
    const updated = await fetchAuth(`/api/expense-categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cat, is_active: cat.is_active === 1 ? 0 : 1 }),
    });
    handleSave(updated.category);
  };

  const grouped = EXPENSE_GROUPS.reduce((acc, g) => {
    const items = filtered.filter(c => c.expense_group === g);
    if (items.length > 0) acc[g] = items;
    return acc;
  }, {} as Record<string, ExpenseCategory[]>);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#1B5E20] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#144a18] transition-colors"
        >
          <Plus className="h-4 w-4" /> New Category
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1B5E20]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No categories yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, cats]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <Badge label={group} className={GROUP_COLORS[group] ?? "bg-gray-100 text-gray-700"} />
                <span className="text-xs text-gray-400">{cats.length} {cats.length === 1 ? "category" : "categories"}</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cats.map(cat => (
                      <tr key={cat.id} className={`transition-colors hover:bg-gray-50/50 ${cat.is_active === 0 ? "opacity-50" : ""}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                        <td className="px-4 py-3">
                          <Badge
                            label={cat.expense_type}
                            className={cat.expense_type === "Fixed" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs max-w-[200px] truncate">{cat.description || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cat.is_active === 1 ? "bg-green-500" : "bg-gray-200"}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${cat.is_active === 1 ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setEditing(cat); setModalOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              disabled={deleting === cat.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CategoryModal
          category={editing}
          onClose={() => { setModalOpen(false); setEditing(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Expenses Sub-Tab ─────────────────────────────────────────────────────────

function ExpensesSubTab({ categories }: { categories: ExpenseCategory[] }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("All");
  const [filterMonth, setFilterMonth] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchAuth("/api/expenses").then(data => { setExpenses(data); setLoading(false); });
  }, []);

  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category_name?.toLowerCase().includes(search.toLowerCase()) ||
      (e.vendor ?? "").toLowerCase().includes(search.toLowerCase());
    const matchGroup = filterGroup === "All" || e.expense_group === filterGroup;
    const matchMonth = !filterMonth || e.expense_date.startsWith(filterMonth);
    return matchSearch && matchGroup && matchMonth;
  });

  const totalFiltered = filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  const fixedTotal = filtered.filter(e => e.expense_type === "Fixed").reduce((sum, e) => sum + Number(e.amount), 0);
  const variableTotal = filtered.filter(e => e.expense_type === "Variable").reduce((sum, e) => sum + Number(e.amount), 0);

  const handleSave = (exp: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(e => e.id === exp.id);
      return idx >= 0 ? prev.map(e => e.id === exp.id ? exp : e) : [exp, ...prev];
    });
    setModalOpen(false);
    setEditing(undefined);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeleting(id);
    await fetchAuth(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  };

  // Unique months for filter
  const months = Array.from(new Set(expenses.map(e => e.expense_date.slice(0, 7)))).sort().reverse();

  return (
    <div>
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Expenses", value: fmt(totalFiltered), color: "text-gray-900", icon: <IndianRupee className="h-4 w-4 text-gray-500" /> },
          { label: "Fixed", value: fmt(fixedTotal), color: "text-blue-700", icon: <TrendingDown className="h-4 w-4 text-blue-500" /> },
          { label: "Variable", value: fmt(variableTotal), color: "text-orange-700", icon: <TrendingUp className="h-4 w-4 text-orange-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-50 rounded-xl flex items-center justify-center">{s.icon}</div>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
        >
          <option value="All">All Groups</option>
          {EXPENSE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
        >
          <option value="">All Time</option>
          {months.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>)}
        </select>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-[#1B5E20] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#144a18] transition-colors ml-auto"
        >
          <Plus className="h-4 w-4" /> Add Expense
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1B5E20]" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400 shadow-sm">
          <IndianRupee className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(exp.expense_date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{exp.category_name ?? "—"}</div>
                      <div className="flex gap-1 mt-0.5">
                        <Badge label={exp.expense_group ?? ""} className={`${GROUP_COLORS[exp.expense_group] ?? "bg-gray-100 text-gray-700"}`} />
                        <Badge label={exp.expense_type ?? ""} className={exp.expense_type === "Fixed" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-gray-800 truncate max-w-[200px]">{exp.description}</p>
                      {exp.vendor && <p className="text-gray-400 text-xs">{exp.vendor}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{exp.payment_method}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{fmt(exp.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(exp); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deleting === exp.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>
            <span className="text-sm font-bold text-gray-900">{fmt(totalFiltered)}</span>
          </div>
        </div>
      )}

      {modalOpen && (
        <ExpenseModal
          expense={editing}
          categories={categories}
          onClose={() => { setModalOpen(false); setEditing(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function ExpenseManagerTab() {
  const [subTab, setSubTab] = useState<"expenses" | "categories">("expenses");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    fetchAuth("/api/expense-categories").then(setCategories).catch(() => {});
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and categorize your business expenses</p>
        </div>
        {/* Sub-Tab Switcher */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
          {(["expenses", "categories"] as const).map(t => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "expenses" ? "Expenses" : "Manage Categories"}
            </button>
          ))}
        </div>
      </div>

      {subTab === "categories" ? (
        <CategoriesSubTab />
      ) : (
        <ExpensesSubTab categories={categories} />
      )}
    </div>
  );
}
