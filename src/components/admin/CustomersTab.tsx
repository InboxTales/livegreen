import React, { useState, useEffect, useMemo } from "react";
import { getCustomers, exportCustomers, Customer } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, ChevronDown, X, Calendar, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── Date preset types ──────────────────────────────────────────────────────────

type DatePreset = 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | 'last7' | 'last30' | 'custom';

const PRESET_LABELS: Record<DatePreset, string> = {
    all: 'All Dates',
    today: 'Today',
    yesterday: 'Yesterday',
    this_month: 'This Month',
    last_month: 'Last Month',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    custom: 'Custom Range',
};

function toDateStr(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function presetDates(preset: DatePreset): { from: string | null; to: string | null } {
    const now = new Date();
    switch (preset) {
        case 'today': return { from: toDateStr(now), to: toDateStr(now) };
        case 'yesterday': {
            const y = new Date(now); y.setDate(now.getDate() - 1);
            return { from: toDateStr(y), to: toDateStr(y) };
        }
        case 'this_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: toDateStr(firstDay), to: toDateStr(now) };
        }
        case 'last_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            return { from: toDateStr(firstDay), to: toDateStr(lastDay) };
        }
        case 'last7': {
            const f = new Date(now); f.setDate(now.getDate() - 6);
            return { from: toDateStr(f), to: toDateStr(now) };
        }
        case 'last30': {
            const f = new Date(now); f.setDate(now.getDate() - 29);
            return { from: toDateStr(f), to: toDateStr(now) };
        }
        default: return { from: null, to: null };
    }
}

// ─── Sorting Options ────────────────────────────────────────────────────────────

type SortOption = 'last_order_desc' | 'last_order_asc' | 'spent_desc' | 'spent_asc' | 'orders_desc' | 'orders_asc';

const SORT_LABELS: Record<SortOption, string> = {
    last_order_desc: 'Last Order: Newest → Oldest',
    last_order_asc: 'Last Order: Oldest → Newest',
    spent_desc: 'Lifetime Value: High → Low',
    spent_asc: 'Lifetime Value: Low → High',
    orders_desc: 'Orders: High → Low',
    orders_asc: 'Orders: Low → High',
};

// ─── Component ──────────────────────────────────────────────────────────────────

export function CustomersTab() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Date filter (by last_order_date)
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showPresetMenu, setShowPresetMenu] = useState(false);

    // Sorting
    const [sortBy, setSortBy] = useState<SortOption>('last_order_desc');

    // Export modal
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportPreset, setExportPreset] = useState<DatePreset>('all');
    const [exportCustomFrom, setExportCustomFrom] = useState("");
    const [exportCustomTo, setExportCustomTo] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (e) {
            console.error("Failed to load customers", e);
        } finally {
            setLoading(false);
        }
    };

    // Resolve active date range for filtering
    const activeDateRange = useMemo<{ from: string | null; to: string | null }>(() => {
        if (datePreset === 'custom') return { from: customFrom || null, to: customTo || null };
        return presetDates(datePreset);
    }, [datePreset, customFrom, customTo]);

    // Filtered & Sorted customers
    const filteredCustomers = useMemo(() => {
        const filtered = customers.filter(c => {
            // Search: name, email, phone/mobile
            const q = searchTerm.toLowerCase();
            const matchesSearch = !q ||
                (c.name || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.phone || '').includes(searchTerm);

            // Date filter: based on last_order_date
            let matchesDate = true;
            if (activeDateRange.from || activeDateRange.to) {
                const lastOrder = c.last_order_date ? c.last_order_date.substring(0, 10) : null;
                if (!lastOrder) {
                    // Customers with no orders are excluded from date-filtered views
                    matchesDate = false;
                } else {
                    if (activeDateRange.from) matchesDate = matchesDate && lastOrder >= activeDateRange.from;
                    if (activeDateRange.to) matchesDate = matchesDate && lastOrder <= activeDateRange.to;
                }
            }

            return matchesSearch && matchesDate;
        });

        // Apply sorting
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'last_order_desc': {
                    const dateA = a.last_order_date ? new Date(a.last_order_date).getTime() : 0;
                    const dateB = b.last_order_date ? new Date(b.last_order_date).getTime() : 0;
                    return dateB - dateA;
                }
                case 'last_order_asc': {
                    const dateA = a.last_order_date ? new Date(a.last_order_date).getTime() : Infinity;
                    const dateB = b.last_order_date ? new Date(b.last_order_date).getTime() : Infinity;
                    return dateA - dateB;
                }
                case 'spent_desc':
                    return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
                case 'spent_asc':
                    return (Number(a.totalSpent) || 0) - (Number(b.totalSpent) || 0);
                case 'orders_desc':
                    return (Number(b.ordersCount) || 0) - (Number(a.ordersCount) || 0);
                case 'orders_asc':
                    return (Number(a.ordersCount) || 0) - (Number(b.ordersCount) || 0);
                default:
                    return 0;
            }
        });
    }, [customers, searchTerm, activeDateRange, sortBy]);

    // Export handler
    const handleExport = async () => {
        setExporting(true);
        try {
            let from: string | undefined, to: string | undefined;
            if (exportPreset === 'custom') {
                from = exportCustomFrom || undefined;
                to = exportCustomTo || undefined;
            } else if (exportPreset !== 'all') {
                const r = presetDates(exportPreset);
                from = r.from || undefined;
                to = r.to || undefined;
            }
            await exportCustomers(from, to);
            setShowExportModal(false);
        } catch (e: any) {
            alert("Export failed: " + e.message);
        } finally {
            setExporting(false);
        }
    };

    // Date filter label
    const filterLabel = datePreset === 'custom'
        ? (customFrom && customTo ? `${customFrom} → ${customTo}` : customFrom || customTo || 'Custom Range')
        : PRESET_LABELS[datePreset];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Customers</h2>
                    <p className="text-gray-500 mt-1">
                        View your customer base and lifetime value.
                        {filteredCustomers.length !== customers.length && (
                            <span className="ml-2 text-[#1B5E20] font-semibold">
                                Showing {filteredCustomers.length} of {customers.length}
                            </span>
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => setShowExportModal(true)}
                    className="bg-[#1B5E20] hover:bg-[#144a18] text-white rounded-xl px-6 h-12 shadow-lg shadow-green-900/20 flex-shrink-0"
                >
                    <Download className="mr-2 h-5 w-5" /> Export Customers
                </Button>
            </div>

            {/* Search + Date filter + Sort row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by Name, Email, or Mobile..."
                        className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Date filter dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowPresetMenu(v => !v)}
                        className={`h-12 px-5 rounded-xl border flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors shadow-sm ${datePreset !== 'all'
                            ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#1B5E20]'}`}
                    >
                        <Calendar className="h-4 w-4" />
                        {filterLabel}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showPresetMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showPresetMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden"
                            >
                                <div className="p-2">
                                    {(Object.keys(PRESET_LABELS) as DatePreset[]).filter(p => p !== 'custom').map(p => (
                                        <button
                                            key={p}
                                            onClick={() => { setDatePreset(p as DatePreset); setShowPresetMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${datePreset === (p as DatePreset) ? 'bg-[#1B5E20] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {PRESET_LABELS[p]}
                                        </button>
                                    ))}
                                    <div className="border-t border-gray-100 my-1" />
                                    <button
                                        onClick={() => setDatePreset('custom')}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${datePreset === 'custom' ? 'bg-[#1B5E20] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        Custom Range
                                    </button>
                                    {datePreset === 'custom' && (
                                        <div className="px-3 pb-3 pt-1 space-y-2">
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold mb-1 block">Start Date</label>
                                                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                                                    className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold mb-1 block">End Date</label>
                                                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                                                    className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none" />
                                            </div>
                                            <Button onClick={() => setShowPresetMenu(false)} className="w-full h-8 rounded-lg bg-[#1B5E20] hover:bg-[#144a18] text-xs">
                                                Apply
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sort Control */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20] outline-none cursor-pointer"
                    >
                        {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Clear filter button */}
                {datePreset !== 'all' && (
                    <button
                        onClick={() => { setDatePreset('all'); setCustomFrom(''); setCustomTo(''); }}
                        className="h-12 w-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
                        title="Clear date filter"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Email</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Mobile</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Last Order</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Orders</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-right">Lifetime Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Loading customers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || datePreset !== 'all'
                                            ? 'No customers match your current filters.'
                                            : 'No customers found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase flex-shrink-0">
                                                    {(customer.name || '?').charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900">{customer.name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{customer.email || '—'}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{customer.phone || '—'}</td>
                                        <td className="px-6 py-4">
                                            {customer.last_order_date ? (
                                                <div>
                                                    <div className="text-gray-700 text-sm">
                                                        {new Date(customer.last_order_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                    </div>
                                                    {customer.last_order_number && (
                                                        <div className="text-xs text-[#1B5E20] font-mono font-bold mt-0.5">
                                                            {customer.last_order_number}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No orders</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                                                {customer.ordersCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[#1B5E20]">₹{customer.totalSpent.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Export Modal */}
            <AnimatePresence>
                {showExportModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40"
                            onClick={() => setShowExportModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 font-serif">Export Customers</h3>
                                        <p className="text-sm text-gray-500 mt-1">Filter by last order date</p>
                                    </div>
                                    <button onClick={() => setShowExportModal(false)}
                                        className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {(Object.keys(PRESET_LABELS) as DatePreset[]).filter(p => p !== 'custom').map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setExportPreset(p)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${exportPreset === p
                                                ? 'bg-[#1B5E20] text-white border-[#1B5E20] shadow-md shadow-green-900/10'
                                                : 'bg-white text-gray-700 border-gray-100 hover:border-[#1B5E20]/30'}`}
                                        >
                                            {PRESET_LABELS[p]}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setExportPreset('custom')}
                                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${exportPreset === 'custom'
                                            ? 'bg-[#1B5E20] text-white border-[#1B5E20] shadow-md shadow-green-900/10'
                                            : 'bg-white text-gray-700 border-gray-100 hover:border-[#1B5E20]/30'}`}
                                    >
                                        Custom Range
                                    </button>

                                    {exportPreset === 'custom' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            className="grid grid-cols-2 gap-3 px-1"
                                        >
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">Start Date</label>
                                                <input type="date" value={exportCustomFrom}
                                                    onChange={e => setExportCustomFrom(e.target.value)}
                                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 font-semibold mb-1.5 block">End Date</label>
                                                <input type="date" value={exportCustomTo}
                                                    onChange={e => setExportCustomTo(e.target.value)}
                                                    className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none" />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="text-xs text-gray-400 mb-5 bg-gray-50 rounded-xl px-4 py-3">
                                    <strong>Exports:</strong> Name, Email, Mobile, Last Order Number, Last Order Date, Last Order Amount, Total Orders, Total Value
                                </div>

                                <Button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="w-full h-12 rounded-xl bg-[#1B5E20] hover:bg-[#144a18] font-bold text-base"
                                >
                                    {exporting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                                    ) : (
                                        <><Download className="mr-2 h-5 w-5" /> Export CSV</>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
