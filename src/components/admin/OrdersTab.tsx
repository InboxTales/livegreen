import React, { useState, useEffect } from "react";
import { getOrders, updateOrderStatus, bookOrderShipment, applyAdminDiscount, Order } from "@/lib/api";
import { generateInvoice } from "@/lib/generateInvoice";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, FileText, Plus, Download, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CreateManualOrderModal } from "@/components/admin/CreateManualOrderModal";

export function OrdersTab() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<"all" | "standard" | "subscription">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [invoicingId, setInvoicingId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrderIdForDiscount, setSelectedOrderIdForDiscount] = useState<string | null>(null);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFrom, setExportFrom] = useState("");
    const [exportTo, setExportTo] = useState("");

    // Format Order ID: keep MAN- IDs as-is; shorten Razorpay "order_XXXX" style IDs
    const formatOrderId = (id: string) => {
        if (id.startsWith('order_')) {
            return id.replace('order_', '#') .substring(0, 12);
        }
        return id;
    };

    const handleSaveDiscount = async () => {
        if (!selectedOrderIdForDiscount) return;
        const val = parseFloat(discountValue);
        if (isNaN(val) || val < 0) {
            alert("Please enter a valid positive number");
            return;
        }
        setApplyingDiscount(true);
        try {
            const res = await applyAdminDiscount(selectedOrderIdForDiscount, discountType, val);
            if (res.success && res.order) {
                setOrders(prev => prev.map(o => o.id === selectedOrderIdForDiscount ? { ...o, ...res.order } : o));
                setShowDiscountModal(false);
                setSelectedOrderIdForDiscount(null);
            } else {
                alert(res.error || "Failed to apply discount");
            }
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setApplyingDiscount(false);
        }
    };

    const handleDownloadInvoice = async (order: Order) => {
        setInvoicingId(order.id);
        try {
            await generateInvoice(order);
        } catch (e: any) {
            alert(`Failed to generate invoice: ${e.message}`);
        } finally {
            setInvoicingId(null);
        }
    };

    const handleBookShipment = async (id: string) => {
        setBookingId(id);
        try {
            const res = await bookOrderShipment(id);
            if (!res.success) alert(`iCarry booking failed:\n\n${res.error}`);
            else alert(`Shipment booked via ${res.courier_name || 'iCarry'}\nAWB: ${res.awb || '—'}\nSent weight: ${res.sentWeight}g\nDimensions: ${res.sentDimensions} cm`);
            await loadOrders();
        } catch (e: any) {
            alert(`iCarry booking failed:\n\n${e.message}`);
        } finally {
            setBookingId(null);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const data = await getOrders();
        setOrders(data);
    };

    const handleUpdateStatus = async (id: string, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;
        await updateOrderStatus(id, newStatus);
        loadOrders();
    };

    const filteredOrders = orders.filter(o => {
        const matchesSearch = (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const isSub = !!Number(o.is_subscription);
        const matchesType = filterType === "all" ? true : (filterType === "subscription" ? isSub : !isSub);

        let matchesDate = true;
        if (dateFrom || dateTo) {
            const orderDate = new Date(o.date);
            if (dateFrom) matchesDate = matchesDate && orderDate >= new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && orderDate <= end;
            }
        }

        return matchesSearch && matchesType && matchesDate;
    });

    const handleExportCSV = () => {
        const toExport = orders.filter(o => {
            let inRange = true;
            if (exportFrom || exportTo) {
                const d = new Date(o.date);
                if (exportFrom) inRange = inRange && d >= new Date(exportFrom);
                if (exportTo) {
                    const end = new Date(exportTo);
                    end.setHours(23, 59, 59, 999);
                    inRange = inRange && d <= end;
                }
            }
            return inRange;
        });

        const headers = ['Order ID', 'Customer Name', 'Email', 'Phone', 'Date', 'Amount', 'Payment Method', 'Status', 'Items'];
        const rows = toExport.map(o => [
            o.id,
            o.customerName || '',
            o.email || '',
            o.phone || '',
            new Date(o.date).toLocaleString(),
            o.totalAmount,
            o.paymentMethod || '',
            o.status,
            o.items.map((it: any) => `${it.name} x${it.quantity}`).join(' | ')
        ]);

        const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders_${exportFrom || 'all'}_to_${exportTo || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportModal(false);
    };

    return (
        <>
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Orders</h2>
                    <p className="text-gray-500 mt-1">Manage and track customer orders here.</p>
                </div>
                <div className="flex gap-2 text-sm font-medium flex-wrap">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-[#1B5E20] text-white shadow-sm rounded-xl hover:bg-[#164a1a] flex items-center gap-2 transition font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Create Manual Order
                    </button>
                    <button
                        onClick={() => {
                            setExportFrom(dateFrom);
                            setExportTo(dateTo);
                            setShowExportModal(true);
                        }}
                        className="px-4 py-2 border border-gray-200 bg-white shadow-sm rounded-xl hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button 
                        onClick={() => loadOrders()}
                        className="px-4 py-2 border border-gray-200 bg-white shadow-sm rounded-xl hover:bg-gray-50 flex items-center gap-2 transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        Refresh & Sync iCarry
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by Order ID, Name, or Email..."
                        className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-xl px-3 h-12">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="text-sm outline-none text-gray-600 bg-transparent"
                        title="From date"
                    />
                    <span className="text-gray-400 text-sm">–</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="text-sm outline-none text-gray-600 bg-transparent"
                        title="To date"
                    />
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-gray-400 hover:text-gray-700 ml-1 text-xs font-bold">✕</button>
                    )}
                </div>
                <div className="w-full sm:w-48 flex-shrink-0">
                    <select
                        className="w-full h-12 px-4 rounded-xl bg-white border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as "all" | "standard" | "subscription")}
                    >
                        <option value="all">All Orders</option>
                        <option value="standard">Standard Orders</option>
                        <option value="subscription">Subscription Orders</option>
                    </select>
                </div>
            </div>

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
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No orders found matching your search.</td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                                            <td className="px-6 py-4 font-mono font-bold text-gray-900" title={order.id}>{formatOrderId(order.id)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-gray-900">{order.customerName}</div>
                                                    {order.is_subscription && (
                                                        <span className="text-[9px] font-black text-white bg-[#1B5E20] px-1.5 py-0.5 rounded uppercase">Sub</span>
                                                    )}
                                                </div>
                                                <div className="text-gray-500 text-xs">{order.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(order.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900">₹{order.totalAmount}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold text-gray-500">{order.paymentMethod}</td>
                                            <td className="px-6 py-4 text-center">
                                                <select
                                                    value={order.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateStatus(order.id, order.status, e.target.value)}
                                                    className={`appearance-none bg-transparent outline-none cursor-pointer pl-3 pr-8 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border 
                            ${order.status === 'delivered' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                                                            order.status === 'paid' ? 'border-teal-200 bg-teal-50 text-teal-700' :
                                                            order.status === 'processing' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                                order.status === 'shipped' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                                                    order.status === 'out_for_delivery' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                                                                        order.status === 'cancelled' || order.status === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-700' :
                                                                            'border-amber-200 bg-amber-50 text-amber-700'}`}
                                                >
                                                    <option value="pending">Pending – Payment not confirmed yet</option>
                                                    <option value="paid">Paid – Payment received, not dispatched</option>
                                                    <option value="processing">Processing – Being packed / prepared</option>
                                                    <option value="shipped">Shipped – Handed off to courier</option>
                                                    <option value="out_for_delivery">Out for Delivery – With delivery agent</option>
                                                    <option value="delivered">Delivered – Customer received</option>
                                                    <option value="cancelled">Cancelled – Order cancelled</option>
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

                                        {/* Expandable Order Details Drawer */}
                                        <AnimatePresence>
                                            {expandedOrder === order.id && (
                                                <tr className="bg-gray-50/50 relative border-t-0" key={`expanded-${order.id}`}>
                                                    <td colSpan={8} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
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
                                                                        {order.icarry_shipment_id && (() => {
                                                                            const shipmentIds = String(order.icarry_shipment_id).split(',').map(s => s.trim());
                                                                            const awbs = String(order.icarry_awb || '').split(',').map(s => s.trim());
                                                                            const trackingUrls = String(order.icarry_tracking_url || '').split(',').map(s => s.trim());
                                                                            return (
                                                                                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                                                                                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-100">
                                                                                        <p className="font-medium text-[#1B5E20] flex items-center gap-2">
                                                                                            <span className="w-2 h-2 rounded-full bg-[#1B5E20]"></span> 
                                                                                            iCarry Shipment ({shipmentIds.length} {shipmentIds.length === 1 ? 'Package' : 'Packages'})
                                                                                        </p>
                                                                                        {order.icarry_status && (
                                                                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white text-[#1B5E20] border border-green-200">
                                                                                                {order.icarry_status}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="space-y-3">
                                                                                        {shipmentIds.map((sid, idx) => {
                                                                                            const awb = awbs[idx] || '';
                                                                                            const url = trackingUrls[idx] || '';
                                                                                            return (
                                                                                                <div key={sid} className="text-xs pb-2 last:pb-0 last:border-b-0 border-b border-green-100/50">
                                                                                                    <p className="font-bold text-gray-700 mb-1">Package {idx + 1}</p>
                                                                                                    <p><span className="text-gray-500 mr-2">Shipment ID:</span> <span className="font-mono font-medium text-gray-900">{sid}</span></p>
                                                                                                    {awb && awb !== '—' && (
                                                                                                        <p><span className="text-gray-500 mr-2">AWB:</span> <span className="font-mono font-bold text-gray-900">{awb}</span></p>
                                                                                                    )}
                                                                                                    {url && url !== '—' && (
                                                                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1B5E20] hover:underline font-bold inline-block mt-1">
                                                                                                            Track Package &rarr;
                                                                                                        </a>
                                                                                                    )}
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
                                                                                {order.icarry_error && (
                                                                                    <p className="text-xs text-red-700 break-words mb-2"><span className="font-medium">Last error:</span> {order.icarry_error}</p>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => handleBookShipment(order.id)}
                                                                                    disabled={bookingId === order.id}
                                                                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#1B5E20] text-white hover:bg-[#164a1a] disabled:opacity-50 transition"
                                                                                >
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
                                                                                        {item.isSubscription && (
                                                                                            <span className="text-[9px] font-black text-[#1B5E20] border border-[#1B5E20]/20 bg-[#1B5E20]/5 px-1 rounded uppercase">Sub</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-gray-500 text-xs">Qty: {item.quantity} × ₹{item.price} {item.isSubscription && `• ${item.frequency}`}</p>
                                                                                </div>
                                                                                <p className="font-bold text-gray-900 text-sm">₹{item.price * item.quantity}</p>
                                                                            </div>
                                                                        ))}
                                                                        {(() => {
                                                                            const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
                                                                            const couponDisc = order.couponDiscount || 0;
                                                                            const adminDisc = order.adminDiscount || 0;
                                                                            const shippingCost = Math.max(0, order.totalAmount - Math.max(0, subtotal - couponDisc - adminDisc));
                                                                            return (
                                                                                <div className="space-y-2 pt-4 border-t border-gray-200">
                                                                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                                                                        <span>Subtotal</span>
                                                                                        <span className="font-semibold text-gray-950">₹{subtotal}</span>
                                                                                    </div>
                                                                                    {(couponDisc > 0 || order.couponCode) && (
                                                                                        <div className="flex justify-between items-center text-sm text-green-700 bg-green-50/50 p-2 rounded-lg">
                                                                                            <span className="font-medium">Coupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                                                                                            <span className="font-bold">-₹{couponDisc}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {adminDisc > 0 && (
                                                                                        <div className="flex justify-between items-center text-sm text-blue-700 bg-blue-50/50 p-2 rounded-lg">
                                                                                            <span className="font-medium">Admin Discount</span>
                                                                                            <span className="font-bold">-₹{adminDisc}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                                                                        <span>Shipping</span>
                                                                                        <span className="font-semibold text-gray-950">₹{shippingCost}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                                        <span className="font-bold text-gray-900">Total</span>
                                                                                        <span className="font-bold text-[#1B5E20] text-lg">₹{order.totalAmount}</span>
                                                                                    </div>
                                                                                    <div className="pt-2">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSelectedOrderIdForDiscount(order.id);
                                                                                                setDiscountType('fixed');
                                                                                                setDiscountValue(adminDisc > 0 ? String(adminDisc) : '');
                                                                                                setShowDiscountModal(true);
                                                                                            }}
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

        {/* Manual Order Creation Modal */}
        {showCreateModal && (
            <CreateManualOrderModal
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    loadOrders();
                    setShowCreateModal(false);
                }}
            />
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
                                <button
                                    onClick={() => setDiscountType('fixed')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                                        discountType === 'fixed'
                                            ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]'
                                    }`}
                                >
                                    Fixed Amount (₹)
                                </button>
                                <button
                                    onClick={() => setDiscountType('percentage')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                                        discountType === 'percentage'
                                            ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]'
                                    }`}
                                >
                                    Percentage (%)
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Discount Value {discountType === 'fixed' ? '(₹)' : '(%)'}
                            </label>
                            <Input
                                type="number"
                                min="0"
                                placeholder={discountType === 'fixed' ? 'e.g. 150' : 'e.g. 10'}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => {
                                setShowDiscountModal(false);
                                setSelectedOrderIdForDiscount(null);
                            }}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveDiscount}
                            disabled={applyingDiscount || !discountValue}
                            className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#154719] disabled:opacity-50 transition"
                        >
                            {applyingDiscount ? 'Applying…' : 'Apply'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Export CSV Modal */}
        {showExportModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-900 font-serif mb-1">Export Orders to CSV</h3>
                    <p className="text-sm text-gray-500 mb-5">Choose a date range to filter exported orders. Leave blank to export all orders.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">From Date</label>
                            <input
                                type="date"
                                value={exportFrom}
                                onChange={e => setExportFrom(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">To Date</label>
                            <input
                                type="date"
                                value={exportTo}
                                onChange={e => setExportTo(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#154719] transition flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

