import React, { useState } from "react";
import { trackOrder, trackOrderByPhone, TrackedOrder } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, MapPin, ArrowRight, Phone, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES = [
    { key: "pending", label: "Placed", icon: Clock, color: "amber" },
    { key: "processing", label: "Processing", icon: Package, color: "blue" },
    { key: "shipped", label: "Shipped", icon: Truck, color: "purple" },
    { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin, color: "orange" },
    { key: "delivered", label: "Delivered", icon: CheckCircle, color: "emerald" },
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    pending: 'Payment Pending',
    captured: 'Payment Received',
    failed: 'Payment Failed',
    refunded: 'Refunded',
};

// Detect if input looks like a mobile number: mostly digits, 7+ chars
function looksLikePhone(input: string): boolean {
    const digits = input.replace(/[\s\-+]/g, '');
    return /^\d{7,15}$/.test(digits);
}

function OrderCard({ order, highlight = false }: { order: TrackedOrder; highlight?: boolean }) {
    const statusIdx = STATUSES.findIndex(s => s.key === order.status);
    const displayId = order.order_number || order.id;

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={`bg-white rounded-3xl shadow-lg border overflow-hidden ${highlight ? 'border-[#1B5E20]/20' : 'border-gray-100'}`}
        >
            <div className="bg-gradient-to-r from-[#1B5E20] to-[#3A8E3C] p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/60 text-xs uppercase tracking-wider font-bold">Order Number</p>
                        <p className="text-xl font-mono font-bold">{displayId}</p>
                        {order.provider_order_id && order.provider_order_id !== order.id && (
                            <p className="text-white/40 text-[10px] font-mono mt-0.5">Ref: {order.provider_order_id}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'delivered' ? 'bg-emerald-400/20 text-emerald-100' :
                            order.status === 'cancelled' ? 'bg-rose-400/20 text-rose-100' : 'bg-white/20'}`}>
                            {order.status}
                        </span>
                        {order.payment_status && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.payment_status === 'captured' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
                                {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {order.status !== 'cancelled' && (
                <div className="px-6 py-8">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200" />
                        <div className="absolute top-5 left-8 h-0.5 bg-[#1B5E20] transition-all duration-500"
                            style={{ width: `${Math.max(0, statusIdx) / (STATUSES.length - 1) * (100 - 12)}%` }} />
                        {STATUSES.map((s, i) => {
                            const active = i <= statusIdx;
                            const current = i === statusIdx;
                            return (
                                <div key={s.key} className="flex flex-col items-center relative z-10">
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.15, type: "spring" }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                            ${active ? 'bg-[#1B5E20] border-[#1B5E20] text-white' : 'bg-white border-gray-200 text-gray-300'}
                                            ${current ? 'ring-4 ring-green-100 scale-110' : ''}`}
                                    >
                                        <s.icon className="w-4 h-4" />
                                    </motion.div>
                                    <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${active ? 'text-[#1B5E20]' : 'text-gray-300'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Order Details */}
            <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Customer</p>
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Date</p>
                        <p className="font-bold text-gray-900">{new Date(order.date).toLocaleDateString('en-IN')}</p>
                    </div>
                </div>
                {order.city && (
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{order.city}{order.state ? `, ${order.state}` : ''}</span>
                    </div>
                )}

                {/* iCarry Tracking Section */}
                {order.tracking && (
                    <div className="border border-green-200 rounded-2xl overflow-hidden bg-green-50/30">
                        <div className="bg-green-100/50 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#1B5E20]" />
                                <span className="font-bold text-[#1B5E20] text-sm">Live Tracking</span>
                                {order.tracking.courier_name && (
                                    <span className="bg-[#1B5E20]/10 text-[#1B5E20] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{order.tracking.courier_name}</span>
                                )}
                            </div>
                            {order.tracking.tracking_url && (
                                <a href={order.tracking.tracking_url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-bold text-[#1B5E20] hover:underline flex items-center gap-1">
                                    Track on iCarry <ArrowRight className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        <div className="px-4 py-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold w-16">AWB</span>
                                <span className="font-mono font-bold text-gray-900 text-sm">{order.tracking.awb}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold w-16">Status</span>
                                <span className="font-bold text-[#1B5E20] text-sm">{order.tracking.current_status}</span>
                            </div>
                        </div>

                        {order.tracking.milestones && order.tracking.milestones.length > 0 && (
                            <div className="border-t border-green-200 px-4 py-3">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-3">Shipment Updates</p>
                                <div className="max-h-60 overflow-y-auto space-y-0 pr-1">
                                    {order.tracking.milestones.slice().reverse().map((m: any, i: number) => (
                                        <div key={i} className="flex gap-3 pb-3 last:pb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? 'bg-[#1B5E20] ring-2 ring-green-200' : 'bg-gray-300'}`} />
                                                {i < order.tracking!.milestones!.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                                            </div>
                                            <div className="flex-1 pb-1">
                                                <p className={`text-sm font-medium ${i === 0 ? 'text-gray-900' : 'text-gray-600'}`}>{m.notes}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                                    {m.datetime && <span>{new Date(m.datetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                                                    {m.location && <span>• {m.location}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Items</p>
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2">
                            {item.image && <img loading="lazy" decoding="async" src={item.image} className="w-10 h-10 rounded-lg object-cover" />}
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-[#1B5E20]/5 rounded-xl p-4 flex justify-between items-center">
                    <span className="font-bold text-[#1B5E20]">Total</span>
                    <span className="text-xl font-black text-[#1B5E20]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function TrackOrder() {
    const [inputValue, setInputValue] = useState("");
    const [orders, setOrders] = useState<TrackedOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchType, setSearchType] = useState<'order' | 'phone' | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        const val = inputValue.trim();
        if (!val) return;
        setLoading(true); setError(""); setOrders([]);

        try {
            if (looksLikePhone(val)) {
                // Phone/mobile lookup
                setSearchType('phone');
                const res = await trackOrderByPhone(val);
                if (res.success && res.orders && res.orders.length > 0) {
                    setOrders(res.orders);
                } else {
                    setError(res.error || "No orders found for this mobile number.");
                }
            } else {
                // Order number or legacy ID lookup
                setSearchType('order');
                const res = await trackOrder(val);
                if (res.success && res.order) {
                    setOrders([res.order]);
                } else if (res.success && res.orders && res.orders.length > 0) {
                    setOrders(res.orders);
                } else {
                    setError(res.error || "Order not found. Please check your Order Number.");
                }
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const isPhone = looksLikePhone(inputValue);

    return (
        <div className="min-h-screen bg-[#FAFAFA] py-16 px-4">
            <div className="max-w-2xl mx-auto">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-[#1B5E20]" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-[#1B5E20] mb-2">Track Your Order</h1>
                    <p className="text-gray-500">Enter your Order Number (e.g. M1000, A1000) or Mobile Number</p>
                </motion.div>

                <form onSubmit={handleTrack} className="mb-8">
                    <div className="relative flex gap-3">
                        <div className="relative flex-1">
                            {inputValue && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    {isPhone
                                        ? <Phone className="w-4 h-4 text-[#1B5E20]" />
                                        : <Hash className="w-4 h-4 text-[#1B5E20]" />}
                                </div>
                            )}
                            <Input
                                placeholder="Order Number or Mobile Number"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className={`h-14 rounded-2xl bg-white border-gray-200 text-lg shadow-sm transition-all ${inputValue ? 'pl-12' : 'pl-6'}`}
                            />
                            {inputValue && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isPhone
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'bg-green-50 text-[#1B5E20]'}`}>
                                        {isPhone ? 'Mobile' : 'Order #'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={loading}
                            className="h-14 px-8 rounded-2xl bg-[#1B5E20] hover:bg-[#144a18] text-base font-bold shadow-lg">
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><Search className="w-5 h-5 mr-2" /> Track</>}
                        </Button>
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Enter a mobile number to see all your orders, or an order number for a specific order.
                    </p>
                </form>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl text-center mb-6">
                        <XCircle className="w-5 h-5 inline mr-2" />{error}
                    </motion.div>
                )}

                <AnimatePresence>
                    {orders.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {searchType === 'phone' && orders.length > 1 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <Phone className="w-4 h-4 text-[#1B5E20]" />
                                    <p className="text-sm font-bold text-[#1B5E20]">
                                        Found {orders.length} orders for this mobile number
                                    </p>
                                </div>
                            )}
                            <div className="space-y-6">
                                {orders.map((order, idx) => (
                                    <OrderCard key={order.order_number || order.id} order={order} highlight={idx === 0} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
