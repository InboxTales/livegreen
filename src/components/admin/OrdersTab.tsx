import React, { useState, useEffect, useMemo } from "react";
import { getOrders, updateOrderStatus, bookOrderShipment, applyAdminDiscount, Order } from "@/lib/api";
import { generateInvoice } from "@/lib/generateInvoice";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, FileText, Plus, Download, Calendar, X, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CreateManualOrderModal } from "@/components/admin/CreateManualOrderModal";

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    pending: 'Created – Awaiting Payment',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    failed: 'Failed',
};

const STATUS_CLASSES: Record<string, string> = {
    delivered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    paid: 'border-teal-200 bg-teal-50 text-teal-700',
    processing: 'border-blue-200 bg-blue-50 text-blue-700',
    shipped: 'border-purple-200 bg-purple-50 text-purple-700',
    out_for_delivery: 'border-orange-200 bg-orange-50 text-orange-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
    failed: 'border-rose-200 bg-rose-50 text-rose-700',
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
};

function statusClass(s: string) {
    return STATUS_CLASSES[s] || STATUS_CLASSES.pending;
}

// ─── Date-range helpers ────────────────────────────────────────────────────────

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

function presetRange(preset: DatePreset): { from: Date | null; to: Date | null } {
    const now = new Date();
    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
    switch (preset) {
        case 'today': return { from: startOfDay(now), to: endOfDay(now) };
        case 'yesterday': { const y = new Date(now); y.setDate(now.getDate() - 1); return { from: startOfDay(y), to: endOfDay(y) }; }
        case 'this_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: startOfDay(firstDay), to: endOfDay(now) };
        }
        case 'last_month': {
            const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
            return { from: startOfDay(firstDay), to: endOfDay(lastDay) };
        }
        case 'last7': { const f = new Date(now); f.setDate(now.getDate() - 6); return { from: startOfDay(f), to: endOfDay(now) }; }
        case 'last30': { const f = new Date(now); f.setDate(now.getDate() - 29); return { from: startOfDay(f), to: endOfDay(now) }; }
        default: return { from: null, to: null };
    }
}

function stableDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseLocalDate(s: string): Date {
    const [y, m, day] = s.split('-').map(Number);
    return new Date(y, m - 1, day, 0, 0, 0, 0);
}

// ─── Order ID display ──────────────────────────────────────────────────────────

function displayOrderId(order: Order): string {
    if (order.order_number) return order.order_number;
    if (order.id.startsWith('order_')) return '#' + order.id.replace('order_', '').substring(0, 10);
    return order.id;
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function buildCSV(orders: Order[]): string {
    const headers = [
        'Order Number',
        'Provider Order ID',
        'Customer Name',
        'Customer Email',
        'Phone',
        'Order Date',
        'Item Name',
        'Quantity',
        'Item Unit Price (INR)',
        'Item Total (INR)',
        'Order Total Amount (INR)',
        'Payment Method',
        'Payment Status',
        'Order Status',
        'AWB Number',
        'Courier Name'
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows: (string | number)[][] = [];

    for (const o of orders) {
        const items = Array.isArray(o.items) ? o.items : [];
        const orderNum = o.order_number || o.id;
        const providerId = o.provider_order_id || (o.id.startsWith('order_') ? o.id : '');
        const dateStr = stableDate(new Date(o.date));
        const orderStatus = STATUS_LABELS[o.status] || o.status;

        // Canonical payment status resolution
        let paymentStatus = o.payment_status;
        if (!paymentStatus || paymentStatus === 'pending') {
            if (['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(o.status) || (o.paymentId && o.paymentId.trim() !== '')) {
                paymentStatus = 'captured';
            } else if (o.status === 'failed') {
                paymentStatus = 'failed';
            } else {
                paymentStatus = 'pending';
            }
        }

        const awb = o.icarry_awb || '';
        const courier = o.icarry_status || '';

        if (items.length === 0) {
            rows.push([
                orderNum,
                providerId,
                o.customerName || '',
                o.email || '',
                o.phone || '',
                dateStr,
                '—',
                0,
                0,
                0,
                o.totalAmount,
                o.paymentMethod || '',
                paymentStatus,
                orderStatus,
                awb,
                courier,
            ]);
        } else {
            for (const it of items) {
                const qty = Number(it.quantity) || 1;
                const price = Number(it.price) || 0;
                const lineTotal = price * qty;

                rows.push([
                    orderNum,
                    providerId,
                    o.customerName || '',
                    o.email || '',
                    o.phone || '',
                    dateStr,
                    it.name || 'Product',
                    qty,
                    price,
                    lineTotal,
                    o.totalAmount,
                    o.paymentMethod || '',
                    paymentStatus,
                    orderStatus,
                    awb,
                    courier,
                ]);
            }
        }
    }

    return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    // Use data: URI instead of blob URL — Chrome ignores the `download` attribute on blob URLs
    // but reliably respects it on data: URIs, giving the file its correct name.
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataUri;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function OrdersTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "standard" | "subscription">("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");

    // Date filter
    const [datePreset, setDatePreset] = useState<DatePreset>('all');
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [showPresetMenu, setShowPresetMenu] = useState(false);

    // Order details
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [invoicingId, setInvoicingId] = useState<string | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    // Export state
    const [exportPreset, setExportPreset] = useState<DatePreset>('all');
    const [exportCustomFrom, setExportCustomFrom] = useState("");
    const [exportCustomTo, setExportCustomTo] = useState("");

    // Admin discount
    const [selectedOrderIdForDiscount, setSelectedOrderIdForDiscount] = useState<string | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        const data = await getOrders();
        setOrders(data);
    };

    // Date bounds for table filter
    const filterBounds = useMemo<{ from: Date | null; to: Date | null }>(() => {
        if (datePreset === 'custom') {
            const from = customFrom ? parseLocalDate(customFrom) : null;
            const to = customTo ? (() => { const d = parseLocalDate(customTo); d.setHours(23, 59, 59, 999); return d; })() : null;
            return { from, to };
        }
        return presetRange(datePreset);
    }, [datePreset, customFrom, customTo]);

    // Filtered orders for table — search covers order_number, id, name, email, phone
    const filteredOrders = useMemo(() => orders.filter(o => {
        // 1. Search
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            (o.id || '').toLowerCase().includes(q) ||
            (o.order_number || '').toLowerCase().includes(q) ||
            (o.provider_order_id || '').toLowerCase().includes(q) ||
            (o.customerName || '').toLowerCase().includes(q) ||
            (o.email || '').toLowerCase().includes(q) ||
            (o.phone || '').includes(searchTerm); // phone: digit matching

        // 2. Order Type
        const isSub = !!Number(o.is_subscription);
        const matchesType = filterType === "all" ? true : (filterType === "subscription" ? isSub : !isSub);

        // 3. Status Filter
        const matchesStatus = statusFilter === "all" ? true : o.status === statusFilter;

        // 4. Payment Filter
        let canonicalPayment = o.payment_status;
        if (!canonicalPayment || canonicalPayment === 'pending') {
            if (['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(o.status) || (o.paymentId && o.paymentId.trim() !== '')) {
                canonicalPayment = 'captured';
            } else if (o.status === 'failed') {
                canonicalPayment = 'failed';
            } else {
                canonicalPayment = 'pending';
            }
        }
        const matchesPayment = paymentFilter === "all" ? true : canonicalPayment === paymentFilter;

        // 5. Date Filter
        let matchesDate = true;
        if (filterBounds.from || filterBounds.to) {
            const orderDate = new Date(o.date);
            if (filterBounds.from) matchesDate = matchesDate && orderDate >= filterBounds.from;
            if (filterBounds.to) matchesDate = matchesDate && orderDate <= filterBounds.to;
        }
        return matchesSearch && matchesType && matchesStatus && matchesPayment && matchesDate;
    }), [orders, searchTerm, filterType, statusFilter, paymentFilter, filterBounds]);

    // Export bounds — independent of table filter
    const exportBounds = useMemo<{ from: Date | null; to: Date | null }>(() => {
        if (exportPreset === 'custom') {
            const from = exportCustomFrom ? parseLocalDate(exportCustomFrom) : null;
            const to = exportCustomTo ? (() => { const d = parseLocalDate(exportCustomTo); d.setHours(23, 59, 59, 999); return d; })() : null;
            return { from, to };
        }
        return presetRange(exportPreset);
    }, [exportPreset, exportCustomFrom, exportCustomTo]);

    const exportOrders = useMemo(() => orders.filter(o => {
        const d = new Date(o.date);
        if (exportBounds.from && d < exportBounds.from) return false;
        if (exportBounds.to && d > exportBounds.to) return false;
        return true;
    }), [orders, exportBounds]);

    // Handlers
    const handleUpdateStatus = async (id: string, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        const newPaymentStatus = ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(newStatus) ? 'captured' : (newStatus === 'failed' ? 'failed' : undefined);
        await updateOrderStatus(id, newStatus, newPaymentStatus);
        loadOrders();
    };

    const handleSaveDiscount = async () => {
        if (!selectedOrderIdForDiscount) return;
        const val = parseFloat(discountValue);
        if (isNaN(val) || val < 0) { alert("Please enter a valid positive number"); return; }
        setApplyingDiscount(true);
        try {
            const res = await applyAdminDiscount(selectedOrderIdForDiscount, discountType, val);
            if (res.success && res.order) {
                setOrders(prev => prev.map(o => o.id === selectedOrderIdForDiscount ? { ...o, ...res.order } : o));
                setShowDiscountModal(false);
                setSelectedOrderIdForDiscount(null);
            } else { alert(res.error || "Failed to apply discount"); }
        } catch (e: any) { alert(`Error: ${e.message}`); }
        finally { setApplyingDiscount(false); }
    };

    const handleDownloadInvoice = async (order: Order) => {
        setInvoicingId(order.id);
        try { await generateInvoice(order); }
        catch (e: any) { alert(`Failed to generate invoice: ${e.message}`); }
        finally { setInvoicingId(null); }
    };

    const handleBookShipment = async (id: string) => {
        setBookingId(id);
        try {
            const res = await bookOrderShipment(id);
            if (!res.success) alert(`iCarry booking failed:\n\n${res.error}`);
            else alert(`Shipment booked via ${res.courier_name || 'iCarry'}\nAWB: ${res.awb || '—'}\nSent weight: ${res.sentWeight}g\nDimensions: ${res.sentDimensions} cm`);
            await loadOrders();
        } catch (e: any) { alert(`iCarry booking failed:\n\n${e.message}`); }
        finally { setBookingId(null); }
    };

    const handleExportCSV = () => {
        if (exportOrders.length === 0) return;
        const rangeLabel = exportPreset !== 'all' ? (exportPreset === 'custom' ? `${exportCustomFrom || 'all'}_to_${exportCustomTo || 'all'}` : exportPreset) : 'all';
        downloadCSV(buildCSV(exportOrders), `orders_${rangeLabel}.csv`);
        setShowExportModal(false);
    };

    const activeDateLabel = datePreset === 'custom'
        ? (customFrom || customTo ? `${customFrom || '…'} → ${customTo || '…'}` : 'Custom Range')
        : PRESET_LABELS[datePreset];

    return (
        <>
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Orders</h2>
                    <p className="text-gray-500 mt-1">Manage and track customer orders here.</p>
                </div>
                <div className="flex gap-3 text-sm font-semibold flex-wrap">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 bg-[#1B5E20] text-white shadow-md shadow-green-900/10 rounded-xl hover:bg-[#144a18] active:scale-95 flex items-center gap-2 transition font-bold"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" /> Create Manual Order
                    </button>
                    <button
                        onClick={() => { setExportPreset(datePreset); setExportCustomFrom(customFrom); setExportCustomTo(customTo); setShowExportModal(true); }}
                        className="px-5 py-2.5 bg-white border-2 border-emerald-800/20 text-[#1B5E20] shadow-sm rounded-xl hover:bg-emerald-50 hover:border-emerald-700 active:scale-95 flex items-center gap-2 transition font-bold"
                    >
                        <Download className="w-4 h-4 text-[#1B5E20] stroke-[2.5]" /> Export CSV
                    </button>
                    <button
                        onClick={() => loadOrders()}
                        className="px-5 py-2.5 bg-white border-2 border-emerald-800/20 text-[#1B5E20] shadow-sm rounded-xl hover:bg-emerald-50 hover:border-emerald-700 active:scale-95 flex items-center gap-2 transition font-bold"
                    >
                        <RotateCw className="w-4 h-4 text-[#1B5E20] stroke-[2.5]" /> Refresh &amp; Sync iCarry
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by Order #, ID, Name, or Email…"
                        className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Date preset dropdown */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setShowPresetMenu(v => !v)}
                        className={`h-12 px-4 flex items-center gap-2 rounded-xl text-sm font-bold transition shadow-sm min-w-[170px] ${datePreset !== 'all' ? 'bg-[#1B5E20] text-white border-2 border-[#1B5E20]' : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-gray-300'}`}
                    >
                        <Calendar className={`w-4 h-4 flex-shrink-0 ${datePreset !== 'all' ? 'text-white' : 'text-[#1B5E20]'}`} />
                        <span className="flex-1 text-left truncate">{activeDateLabel}</span>
                        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showPresetMenu ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {showPresetMenu && datePreset !== 'custom' && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPresetMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="absolute left-0 top-[calc(100%+6px)] z-20 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden w-52"
                                >
                                    {(Object.keys(PRESET_LABELS) as DatePreset[]).map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => { setDatePreset(preset); if (preset !== 'custom') { setCustomFrom(''); setCustomTo(''); setShowPresetMenu(false); } }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 ${datePreset === preset ? 'font-semibold text-[#1B5E20]' : 'text-gray-700'}`}
                                        >{PRESET_LABELS[preset]}</button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                        {showPresetMenu && datePreset === 'custom' && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPresetMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                                    className="absolute left-0 top-[calc(100%+6px)] z-20 bg-white border border-gray-100 shadow-xl rounded-2xl p-4 w-72"
                                >
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {(Object.keys(PRESET_LABELS) as DatePreset[]).map(p => (
                                            <button key={p} onClick={() => { setDatePreset(p); if (p !== 'custom') { setCustomFrom(''); setCustomTo(''); setShowPresetMenu(false); } }}
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${datePreset === p ? 'bg-[#1B5E20] text-white border-[#1B5E20]' : 'text-gray-600 border-gray-200 hover:border-[#1B5E20]'}`}>
                                                {PRESET_LABELS[p]}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Custom Range</p>
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">From</label>
                                            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20]" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">To</label>
                                            <input type="date" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20]" />
                                        </div>
                                        <button onClick={() => setShowPresetMenu(false)} className="mt-1 w-full py-2 bg-[#1B5E20] text-white rounded-lg text-sm font-semibold hover:bg-[#154719] transition">Apply</button>
                                        <button onClick={() => { setDatePreset('all'); setCustomFrom(''); setCustomTo(''); setShowPresetMenu(false); }} className="w-full py-1.5 text-gray-500 text-xs hover:text-gray-700">Clear</button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Payment filter */}
                <div className="w-full sm:w-44 flex-shrink-0">
                    <select
                        className="w-full h-12 px-3 rounded-xl bg-white border-2 border-gray-200 shadow-sm text-gray-800 font-bold text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] cursor-pointer hover:border-gray-300 transition"
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                        <option value="all">All Payments</option>
                        <option value="captured">Paid / Captured</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>

                {/* Status filter */}
                <div className="w-full sm:w-48 flex-shrink-0">
                    <select
                        className="w-full h-12 px-3 rounded-xl bg-white border-2 border-gray-200 shadow-sm text-gray-800 font-bold text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] cursor-pointer hover:border-gray-300 transition"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Created – Awaiting Payment</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>

                {/* Order type filter */}
                <div className="w-full sm:w-44 flex-shrink-0">
                    <select
                        className="w-full h-12 px-4 rounded-xl bg-white border-2 border-gray-200 shadow-sm text-gray-800 font-bold text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] cursor-pointer hover:border-gray-300 transition"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as "all" | "standard" | "subscription")}
                    >
                        <option value="all">All Orders</option>
                        <option value="standard">Standard Orders</option>
                        <option value="subscription">Subscription Orders</option>
                    </select>
                </div>

                {/* Active filter badge */}
                {(datePreset !== 'all' || searchTerm || filterType !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all') && (
                    <div className="flex items-center gap-2 h-12 px-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex-shrink-0">
                        <span>{filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}</span>
                        <button onClick={() => { setDatePreset('all'); setCustomFrom(''); setCustomTo(''); setSearchTerm(''); setFilterType('all'); setStatusFilter('all'); setPaymentFilter('all'); }} className="hover:text-amber-900" title="Clear all filters">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Order ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Customer</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Payment</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Invoice</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Search className="w-8 h-8 opacity-30" />
                                            <p className="font-semibold text-gray-500">No orders found</p>
                                            <p className="text-sm">Try adjusting your search or date filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900" title={`Provider ID: ${order.id}`}>
                                                <div className="flex flex-col">
                                                    <span>{displayOrderId(order)}</span>
                                                    {order.order_number && order.id !== order.order_number && (
                                                        <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                                                            {order.id.startsWith('order_') ? `rzp: ${order.id.substring(0, 16)}` : order.id}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-gray-900">{order.customerName}</div>
                                                    {Boolean(Number(order.is_subscription)) && <span className="text-[9px] font-black text-white bg-[#1B5E20] px-1.5 py-0.5 rounded uppercase">Sub</span>}
                                                </div>
                                                <div className="text-gray-500 text-xs">{order.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(order.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">&#8377;{order.totalAmount}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold text-gray-500">{order.paymentMethod}</td>
                                            <td className="px-6 py-4 text-center">
                                                <select
                                                    value={order.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateStatus(order.id, order.status, e.target.value)}
                                                    className={`appearance-none bg-transparent outline-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold tracking-wide border ${statusClass(order.status)}`}
                                                >
                                                    <option value="pending">Created – Awaiting Payment</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="out_for_delivery">Out for Delivery</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    disabled={invoicingId === order.id}
                                                    title="Download PDF Invoice"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20] hover:text-white disabled:opacity-50 transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {invoicingId === order.id ? "Generating…" : "Invoice"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <ChevronDown className={`inline-block w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                                            </td>
                                        </tr>

                                        <AnimatePresence>
                                            {expandedOrder === order.id && (
                                                <tr className="bg-gray-50/50 relative border-t-0" key={`expanded-${order.id}`}>
                                                    <td colSpan={8} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden border-b border-gray-100"
                                                        >
                                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 whitespace-normal">
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Shipping Information</h4>
                                                                    <div className="space-y-2 text-sm text-gray-600">
                                                                        <p><span className="font-medium text-gray-900 mr-2">Name:</span> {order.customerName}</p>
                                                                        <p><span className="font-medium text-gray-900 mr-2">Phone:</span> {order.phone}</p>
                                                                        <p><span className="font-medium text-gray-900 mr-2">Email:</span> {order.email}</p>
                                                                        <p className="break-words"><span className="font-medium text-gray-900 mr-2">Address:</span> {order.address}, {order.city}, {order.state} - {order.zip}</p>
                                                                        {order.order_number && <p><span className="font-medium text-gray-900 mr-2">Order #:</span><span className="font-mono">{order.order_number}</span></p>}
                                                                        {order.id.startsWith('order_') && <p><span className="font-medium text-gray-900 mr-2">Razorpay ID:</span><span className="font-mono text-xs">{order.id}</span></p>}
                                                                        {order.payment_status && (
                                                                            <p><span className="font-medium text-gray-900 mr-2">Payment Status:</span>
                                                                                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ml-1 ${order.payment_status === 'captured' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                                                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                                                                </span>
                                                                            </p>
                                                                        )}
                                                                        {order.icarry_shipment_id && (() => {
                                                                            const shipmentIds = String(order.icarry_shipment_id).split(',').map((s: string) => s.trim());
                                                                            const awbs = String(order.icarry_awb || '').split(',').map((s: string) => s.trim());
                                                                            const trackingUrls = String(order.icarry_tracking_url || '').split(',').map((s: string) => s.trim());
                                                                            return (
                                                                                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                                                                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-100">
                                                                                        <p className="font-medium text-[#1B5E20] flex items-center gap-2">
                                                                                            <span className="w-2 h-2 rounded-full bg-[#1B5E20]"></span>
                                                                                            iCarry Shipment ({shipmentIds.length} {shipmentIds.length === 1 ? 'Package' : 'Packages'})
                                                                                        </p>
                                                                                        {order.icarry_status && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1B5E20] border border-green-200">{order.icarry_status}</span>}
                                                                                    </div>
                                                                                    <div className="space-y-3">
                                                                                        {shipmentIds.map((sid: string, idx: number) => {
                                                                                            const awb = awbs[idx] || '';
                                                                                            const url = trackingUrls[idx] || '';
                                                                                            return (
                                                                                                <div key={sid} className="text-xs pb-2 last:pb-0 last:border-b-0 border-b border-green-100/50">
                                                                                                    <p className="font-bold text-gray-700 mb-1">Package {idx + 1}</p>
                                                                                                    <p><span className="text-gray-500 mr-2">Shipment ID:</span><span className="font-mono font-medium text-gray-900">{sid}</span></p>
                                                                                                    {awb && awb !== '—' && <p><span className="text-gray-500 mr-2">AWB:</span><span className="font-mono font-bold text-gray-900">{awb}</span></p>}
                                                                                                    {url && url !== '—' && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1B5E20] hover:underline font-bold inline-block mt-1">Track Package &rarr;</a>}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                    <div className="mt-3 pt-3 border-t border-green-100">
                                                                                        <button
                                                                                            onClick={() => { if (confirm("Cancel the current shipment and re-book with the latest product weight, dimensions and courier?")) handleBookShipment(order.id); }}
                                                                                            disabled={bookingId === order.id || ['shipped', 'out_for_delivery', 'delivered'].includes(order.status)}
                                                                                            title={['shipped', 'out_for_delivery', 'delivered'].includes(order.status) ? "Cannot re-book once shipped/delivered" : ""}
                                                                                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20] hover:text-white disabled:opacity-50 transition"
                                                                                        >
                                                                                            {bookingId === order.id ? "Re-booking…" : "Re-book (apply updated details)"}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                        {!order.icarry_shipment_id && (
                                                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                                                                                <p className="font-medium text-amber-800 mb-1">No iCarry shipment booked</p>
                                                                                {order.icarry_error && <p className="text-xs text-red-700 break-words mb-2"><span className="font-medium">Last error:</span> {order.icarry_error}</p>}
                                                                                <button onClick={() => handleBookShipment(order.id)} disabled={bookingId === order.id} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1B5E20] text-white hover:bg-[#164a1a] disabled:opacity-50 transition">
                                                                                    {bookingId === order.id ? "Booking…" : (order.icarry_error ? "Retry iCarry booking" : "Book iCarry shipment")}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Order Items</h4>
                                                                    <div className="space-y-4">
                                                                        {order.items.map((item: any, i: number) => (
                                                                            <div key={i} className="flex items-center gap-4">
                                                                                <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-white border border-gray-200" />
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                                                                                        {Boolean(item.isSubscription) && <span className="text-[9px] font-black text-[#1B5E20] border border-[#1B5E20]/20 bg-[#1B5E20]/5 px-1 rounded uppercase">Sub</span>}
                                                                                    </div>
                                                                                    <p className="text-gray-500 text-xs">Qty: {item.quantity} x &#8377;{item.price} {Boolean(item.isSubscription) && `• ${item.frequency}`}</p>
                                                                                </div>
                                                                                <p className="font-bold text-gray-900 text-sm">&#8377;{item.price * item.quantity}</p>
                                                                            </div>
                                                                        ))}
                                                                        {(() => {
                                                                            const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                                                                            const couponDisc = order.couponDiscount || 0;
                                                                            const adminDisc = order.adminDiscount || 0;
                                                                            const shippingCost = Math.max(0, order.totalAmount - Math.max(0, subtotal - couponDisc - adminDisc));
                                                                            return (
                                                                                <div className="space-y-2 pt-4 border-t border-gray-200">
                                                                                    <div className="flex justify-between items-center text-sm text-gray-500"><span>Subtotal</span><span className="font-semibold text-gray-950">&#8377;{subtotal}</span></div>
                                                                                    {(couponDisc > 0 || order.couponCode) && (
                                                                                        <div className="flex justify-between items-center text-sm text-green-700 bg-green-50/50 p-2 rounded-lg">
                                                                                            <span className="font-medium">Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                                                                                            <span className="font-bold">-&#8377;{couponDisc}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {adminDisc > 0 && (
                                                                                        <div className="flex justify-between items-center text-sm text-blue-700 bg-blue-50/50 p-2 rounded-lg">
                                                                                            <span className="font-medium">Admin Discount</span>
                                                                                            <span className="font-bold">-&#8377;{adminDisc}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex justify-between items-center text-sm text-gray-500"><span>Shipping</span><span className="font-semibold text-gray-950">&#8377;{shippingCost}</span></div>
                                                                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                                        <span className="font-bold text-gray-900">Total</span>
                                                                                        <span className="font-bold text-[#1B5E20] text-lg">&#8377;{order.totalAmount}</span>
                                                                                    </div>
                                                                                    <div className="pt-2">
                                                                                        <button
                                                                                            onClick={() => { setSelectedOrderIdForDiscount(order.id); setDiscountType('fixed'); setDiscountValue(adminDisc > 0 ? String(adminDisc) : ''); setShowDiscountModal(true); }}
                                                                                            className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors text-center"
                                                                                        >
                                                                                            {adminDisc > 0 ? "Edit Admin Discount" : "Apply Admin Discount"}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {showCreateModal && (
            <CreateManualOrderModal onClose={() => setShowCreateModal(false)} onSuccess={() => { loadOrders(); setShowCreateModal(false); }} />
        )}

        {/* Admin Discount Modal */}
        {showDiscountModal && selectedOrderIdForDiscount && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-900 font-serif mb-4">Apply Admin Discount</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Discount Type</label>
                            <div className="flex gap-2">
                                <button onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${discountType === 'fixed' ? 'bg-[#1B5E20] text-white border-[#1B5E20]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]'}`}>Fixed Amount (&#8377;)</button>
                                <button onClick={() => setDiscountType('percentage')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${discountType === 'percentage' ? 'bg-[#1B5E20] text-white border-[#1B5E20]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]'}`}>Percentage (%)</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Discount Value {discountType === 'fixed' ? '(&#8377;)' : '(%)'}</label>
                            <Input type="number" min="0" placeholder={discountType === 'fixed' ? 'e.g. 150' : 'e.g. 10'} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]" />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => { setShowDiscountModal(false); setSelectedOrderIdForDiscount(null); }} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={handleSaveDiscount} disabled={applyingDiscount || !discountValue} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#154719] disabled:opacity-50 transition">{applyingDiscount ? 'Applying…' : 'Apply'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Export CSV Modal */}
        {showExportModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-900 font-serif">Export Orders to CSV</h3>
                        <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-sm text-gray-500 mb-5">Select a date range. Export runs across all orders, independent of the current page filter.</p>

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {(['all', 'today', 'yesterday', 'this_month', 'last_month', 'last7', 'last30', 'custom'] as DatePreset[]).map(p => (
                            <button key={p} onClick={() => { setExportPreset(p); if (p !== 'custom') { setExportCustomFrom(''); setExportCustomTo(''); } }}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${exportPreset === p ? 'bg-[#1B5E20] text-white border-[#1B5E20]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]'}`}>
                                {PRESET_LABELS[p]}
                            </button>
                        ))}
                    </div>

                    {/* Custom date inputs */}
                    {exportPreset === 'custom' && (
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Date</label>
                                <input type="date" value={exportCustomFrom} onChange={e => setExportCustomFrom(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To Date</label>
                                <input type="date" value={exportCustomTo} min={exportCustomFrom} onChange={e => setExportCustomTo(e.target.value)} className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]" />
                            </div>
                        </div>
                    )}

                    {/* Order count preview */}
                    <div className={`rounded-xl p-3 mb-5 text-sm text-center font-semibold ${exportOrders.length === 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-[#1B5E20]/5 text-[#1B5E20] border border-[#1B5E20]/10'}`}>
                        {exportOrders.length === 0
                            ? 'No orders in the selected date range — nothing to export.'
                            : `${exportOrders.length} order${exportOrders.length !== 1 ? 's' : ''} will be exported`}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">Cancel</button>
                        <button onClick={handleExportCSV} disabled={exportOrders.length === 0} className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#154719] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Download CSV
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
