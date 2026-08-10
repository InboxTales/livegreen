import React, { useState } from "react";
import { trackOrder, trackOrderByPhone, TrackedOrder } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, MapPin, ArrowRight, Phone, Hash, ShieldCheck, Sparkles } from "lucide-react";
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

function getTimelineStageIndex(order: TrackedOrder): number {
    const s = (order.status || '').toLowerCase();
    const trackingStatus = (order.tracking?.current_status || '').toLowerCase();

    // 1. Check live iCarry courier status first
    if (trackingStatus.includes('delivered') || trackingStatus.includes('dlvd')) return 4;
    if (trackingStatus.includes('out for delivery') || trackingStatus.includes('ofd')) return 3;
    if (trackingStatus.includes('in transit') || trackingStatus.includes('shipped') || trackingStatus.includes('dispatched')) return 2;
    if (trackingStatus.includes('manifest') || trackingStatus.includes('booked') || trackingStatus.includes('pickup') || trackingStatus.includes('processing')) return 1;

    // 2. Fall back to DB order status
    if (s === 'delivered') return 4;
    if (s === 'out_for_delivery') return 3;
    if (s === 'shipped') return 2;
    if (s === 'processing') return 1;
    if (s === 'paid' || s === 'pending' || s === 'created') return 0;

    return 0;
}

function OrderCard({ order, highlight = false }: { order: TrackedOrder; highlight?: boolean }) {
    const statusIdx = getTimelineStageIndex(order);
    const displayId = order.order_number || order.id;

    const isPaid = order.status === 'paid' || order.payment_status === 'captured';
    const isDelivered = order.status === 'delivered';
    const isCancelled = order.status === 'cancelled';
    const isShipped = order.status === 'shipped';
    const isProcessing = order.status === 'processing';
    const isOFD = order.status === 'out_for_delivery';

    let primaryBadgeText = "ORDER PLACED";
    let primaryBadgeClass = "bg-amber-400/30 text-amber-100 border border-amber-400/30";

    if (isDelivered) {
        primaryBadgeText = "DELIVERED";
        primaryBadgeClass = "bg-emerald-400/30 text-emerald-100 border border-emerald-400/30";
    } else if (isCancelled) {
        primaryBadgeText = "CANCELLED";
        primaryBadgeClass = "bg-rose-400/30 text-rose-100 border border-rose-400/30";
    } else if (isOFD) {
        primaryBadgeText = "OUT FOR DELIVERY";
        primaryBadgeClass = "bg-orange-400/30 text-orange-100 border border-orange-400/30";
    } else if (isShipped) {
        primaryBadgeText = "SHIPPED";
        primaryBadgeClass = "bg-purple-400/30 text-purple-100 border border-purple-400/30";
    } else if (isProcessing) {
        primaryBadgeText = "PROCESSING";
        primaryBadgeClass = "bg-blue-400/30 text-blue-100 border border-blue-400/30";
    } else if (isPaid) {
        primaryBadgeText = "PAID";
        primaryBadgeClass = "bg-emerald-400/30 text-emerald-100 border border-emerald-400/30";
    }

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={`bg-white rounded-3xl shadow-xl border overflow-hidden ${highlight ? 'border-[#1B5E20]/30 ring-2 ring-[#1B5E20]/10' : 'border-gray-100'}`}
        >
            <div className="bg-gradient-to-r from-[#1B5E20] via-[#2A752D] to-[#3A8E3C] p-6 sm:p-7 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-white/70 text-xs uppercase tracking-widest font-bold">Order Number</p>
                        <p className="text-2xl font-mono font-bold mt-0.5">{displayId}</p>
                        {order.provider_order_id && order.provider_order_id !== order.id && (
                            <p className="text-white/50 text-[11px] font-mono mt-1">Razorpay Ref: {order.provider_order_id}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${primaryBadgeClass}`}>
                            {primaryBadgeText}
                        </span>
                        {isPaid ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-400/20">
                                Payment Received
                            </span>
                        ) : order.payment_status === 'refunded' ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-100">
                                Refunded
                            </span>
                        ) : order.payment_status === 'failed' ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-400/20 text-rose-100">
                                Payment Failed
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-100">
                                Payment Pending
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {order.status !== 'cancelled' && (
                <div className="px-6 py-8 sm:px-8">
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
                                            ${active ? 'bg-[#1B5E20] border-[#1B5E20] text-white shadow-md' : 'bg-white border-gray-200 text-gray-300'}
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
            <div className="px-6 pb-7 sm:px-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Customer</p>
                        <p className="font-bold text-gray-900 mt-0.5">{order.customerName}</p>
                    </div>
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Order Placed</p>
                        <p className="font-bold text-gray-900 mt-0.5">{new Date(order.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                    </div>
                </div>
                {order.city && (
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#1B5E20]" />
                        <span className="text-gray-800 font-medium text-sm">{order.city}{order.state ? `, ${order.state}` : ''}</span>
                    </div>
                )}

                {/* Info banner when no iCarry tracking URL yet */}
                {!order.tracking && order.status !== 'cancelled' && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                        <Package className="w-5 h-5 text-[#1B5E20] flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-emerald-950">
                            <p className="font-bold text-sm text-[#1B5E20]">Order Confirmed &amp; Processing</p>
                            <p className="mt-0.5 text-gray-600">Your order is being packaged. Live AWB tracking &amp; courier milestones will appear here as soon as shipment is dispatched via iCarry.</p>
                        </div>
                    </div>
                )}

                {/* iCarry Live Tracking Section */}
                {order.tracking && (
                    <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-emerald-50/40 shadow-sm">
                        <div className="bg-emerald-100/60 px-5 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-[#1B5E20]" />
                                <span className="font-bold text-[#1B5E20] text-sm">Live iCarry Courier Tracking</span>
                                {order.tracking.courier_name && (
                                    <span className="bg-[#1B5E20]/10 text-[#1B5E20] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">{order.tracking.courier_name}</span>
                                )}
                            </div>
                            {order.tracking.tracking_url && (
                                <a href={order.tracking.tracking_url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs font-bold text-[#1B5E20] hover:underline flex items-center gap-1">
                                    Track on Courier Site <ArrowRight className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                        <div className="px-5 py-4 space-y-2.5">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold w-16">AWB #</span>
                                <span className="font-mono font-bold text-gray-900 text-sm">{order.tracking.awb}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold w-16">Status</span>
                                <span className="font-bold text-[#1B5E20] text-sm">{order.tracking.current_status}</span>
                            </div>
                        </div>

                        {order.tracking.milestones && order.tracking.milestones.length > 0 && (
                            <div className="border-t border-emerald-200 px-5 py-4 bg-white/60">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">Shipment Updates</p>
                                <div className="max-h-60 overflow-y-auto space-y-0 pr-1">
                                    {order.tracking.milestones.slice().reverse().map((m: any, i: number) => (
                                        <div key={i} className="flex gap-3 pb-3 last:pb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? 'bg-[#1B5E20] ring-4 ring-emerald-100' : 'bg-gray-300'}`} />
                                                {i < order.tracking!.milestones!.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                                            </div>
                                            <div className="flex-1 pb-1">
                                                <p className={`text-sm font-medium ${i === 0 ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{m.notes}</p>
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
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Ordered Items</p>
                    {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3.5 py-2.5 border-b border-gray-50 last:border-0">
                            {item.image && <img loading="lazy" decoding="async" src={item.image} className="w-11 h-11 rounded-xl object-cover border border-gray-100" />}
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                <p className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-900 text-base">₹{item.price * item.quantity}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-[#1B5E20]/5 border border-[#1B5E20]/10 rounded-2xl p-4 flex justify-between items-center">
                    <span className="font-bold text-[#1B5E20]">Total Paid</span>
                    <span className="text-2xl font-black text-[#1B5E20]">₹{order.totalAmount.toLocaleString('en-IN')}</span>
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
        <div className="min-h-screen bg-gradient-to-b from-[#F5FAF5] via-[#FAFAFA] to-white pt-36 sm:pt-44 pb-28 px-4 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-emerald-200/20 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-2xl mx-auto relative z-10">
                {/* Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-10">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1B5E20]/10 text-[#1B5E20] text-[11px] font-black uppercase tracking-widest font-inter mb-4 border border-[#1B5E20]/15">
                        <Sparkles className="w-3.5 h-3.5 text-[#1B5E20]" /> Live Order Tracking
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 tracking-tight mb-3">
                        Track Your Shipment
                    </h1>
                    <p className="text-gray-500 text-base max-w-md mx-auto">
                        Enter your Order Number (e.g. M1000, A1000) or Mobile Number to check real-time courier updates.
                    </p>
                </motion.div>

                {/* Form Card */}
                <motion.form
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    onSubmit={handleTrack}
                    className="bg-white/80 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-xl border border-gray-100 mb-8"
                >
                    <div className="relative flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            {inputValue && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    {isPhone
                                        ? <Phone className="w-4 h-4 text-[#1B5E20]" />
                                        : <Hash className="w-4 h-4 text-[#1B5E20]" />}
                                </div>
                            )}
                            <Input
                                placeholder="Order Number or Mobile Number..."
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className={`h-14 rounded-2xl bg-gray-50/80 border-gray-200 text-gray-900 text-base font-semibold shadow-inner focus:bg-white focus:border-[#1B5E20] focus:ring-[#1B5E20] transition-all ${inputValue ? 'pl-12' : 'pl-6'}`}
                            />
                            {inputValue && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isPhone
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-emerald-100 text-[#1B5E20]'}`}>
                                        {isPhone ? 'Mobile' : 'Order #'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button type="submit" disabled={loading}
                            className="h-14 px-8 rounded-2xl bg-[#1B5E20] hover:bg-[#144a18] text-white text-base font-bold shadow-lg shadow-green-950/20 active:scale-95 transition-all">
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><Search className="w-5 h-5 mr-2" /> Track Order</>}
                        </Button>
                    </div>
                </motion.form>

                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-50 border border-rose-200/80 text-rose-700 p-4 rounded-2xl text-center mb-8 text-sm font-semibold shadow-sm">
                        <XCircle className="w-5 h-5 inline mr-2 text-rose-500" />{error}
                    </motion.div>
                )}

                {/* Feature Trust Badges (Shown when no orders displayed) */}
                {orders.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto mt-10"
                    >
                        <div className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-[#1B5E20] flex-shrink-0">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">iCarry Live Sync</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Real-time courier updates</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-[#1B5E20] flex-shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">Mobile Lookup</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Find all your orders</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-[#1B5E20] flex-shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-900">100% Secure</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">Private order data</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Results Section */}
                <AnimatePresence>
                    {orders.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
                            {searchType === 'phone' && orders.length > 1 && (
                                <div className="flex items-center gap-2 mb-5 px-1">
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

