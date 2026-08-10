import React, { useState, useEffect } from "react";
import { getPromoCodes, createPromoCode, updatePromoCode, updatePromoStatus, deletePromoCode, PromoCode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Save, Search, Settings2, Trash2, Users, MousePointer2, PenLine, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function PromoCodesTab() {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<PromoCode>>({ is_private: false });
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getPromoCodes();
            setPromos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load promo codes", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this promo code? This will also delete its usage history.")) return;
        try {
            await deletePromoCode(id);
            loadData();
        } catch (err: any) {
            alert(err.message || "Error deleting promo code");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentItem.id) {
                await updatePromoCode(currentItem.id, currentItem);
            } else {
                await createPromoCode(currentItem);
            }
            setIsEditing(false);
            setCurrentItem({});
            loadData();
        } catch (err: any) {
            alert(err.message || `Error ${currentItem.id ? 'updating' : 'creating'} promo code`);
        }
    };

    const toggleStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await updatePromoStatus(id, newStatus);
        loadData();
    };

    const filteredItems = promos.filter(p => p.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Promo Codes</h2>
                    <p className="text-gray-500 mt-1">Manage discounts and promotional campaigns.</p>
                </div>
                <Button
                    onClick={() => { setIsEditing(true); setCurrentItem({ discountType: 'percentage', discountValue: 10, minSpend: 0, status: 'active', totalLimit: 0, oneTimePerUser: false, is_private: false, startDate: '', startTime: '00:00' }); }}
                    className="bg-[#1B5E20] hover:bg-[#144a18] text-white rounded-xl px-6 h-12 shadow-lg shadow-green-900/20"
                >
                    <Plus className="mr-2 h-5 w-5" /> Create Promo Code
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search promo codes..."
                    className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isEditing ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl bg-white p-8 shadow-lg border border-gray-100 max-w-2xl"
                >
                    <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
                        <h3 className="text-xl font-bold text-[#1B5E20] font-serif">{currentItem.id ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
                        <button type="button" onClick={() => setIsEditing(false)} className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Code (e.g., SUMMER20)</label>
                            <Input
                                value={currentItem.code || ""}
                                onChange={(e) => setCurrentItem({ ...currentItem, code: e.target.value.toUpperCase() })}
                                required
                                className="h-12 rounded-xl uppercase font-mono font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Discount Type</label>
                                <select
                                    className="w-full h-12 rounded-xl border border-gray-200 px-4 focus:border-[#1B5E20] focus:ring-1 focus:ring-[#1B5E20] outline-none"
                                    value={currentItem.discountType || 'percentage'}
                                    onChange={(e) => setCurrentItem({ ...currentItem, discountType: e.target.value as any })}
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Discount Value</label>
                                <Input
                                    type="number"
                                    value={currentItem.discountValue || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, discountValue: parseInt(e.target.value) })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Minimum Spend (₹)</label>
                                <Input
                                    type="number"
                                    value={currentItem.minSpend || 0}
                                    onChange={(e) => setCurrentItem({ ...currentItem, minSpend: parseInt(e.target.value) })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Global Usage Limit (0 = ∞)</label>
                                <Input
                                    type="number"
                                    value={currentItem.totalLimit || 0}
                                    onChange={(e) => setCurrentItem({ ...currentItem, totalLimit: parseInt(e.target.value) })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Start Date (Optional)</label>
                                <Input
                                    type="date"
                                    value={currentItem.startDate || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, startDate: e.target.value })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Start Time</label>
                                <Input
                                    type="time"
                                    value={currentItem.startTime || '00:00'}
                                    onChange={(e) => setCurrentItem({ ...currentItem, startTime: e.target.value })}
                                    className="h-12 rounded-xl"
                                    disabled={!currentItem.startDate}
                                />
                                <p className="text-xs text-gray-400">Promo becomes active at this date &amp; time. Leave empty = active immediately.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Expiry Date (Optional)</label>
                                <Input
                                    type="date"
                                    value={currentItem.expiryDate || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="flex items-center h-full pt-8">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
                                        checked={currentItem.oneTimePerUser || false}
                                        onChange={(e) => setCurrentItem({ ...currentItem, oneTimePerUser: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold text-gray-700">One-time per customer</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-center h-full">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                                        checked={currentItem.is_private || false}
                                        onChange={(e) => setCurrentItem({ ...currentItem, is_private: e.target.checked })}
                                    />
                                    <span className="text-sm font-bold text-gray-700">Private Coupon (Hidden from Checkout Available Offers)</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-8 rounded-xl border-gray-200">Cancel</Button>
                            <Button type="submit" className="h-12 px-8 rounded-xl bg-[#1B5E20] hover:bg-[#144a18]">
                                <Save className="mr-2 h-4 w-4" /> {currentItem.id ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredItems.map(item => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative group"
                            >
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <button
                                        onClick={() => { setIsEditing(true); setCurrentItem(item); }}
                                        className="p-2 text-gray-300 hover:text-[#1B5E20] transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit Coupon"
                                    >
                                        <PenLine className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(item.id, item.status)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border
                                            ${item.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'}`}
                                    >
                                        {item.status}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Coupon"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mb-4 inline-flex items-center justify-center p-3 rounded-2xl bg-orange-50 text-orange-600">
                                    <Settings2 className="w-6 h-6" />
                                </div>

                                <h3 className="text-2xl font-bold font-mono text-gray-900 mb-1 tracking-tight">{item.code}</h3>
                                <div className="text-3xl font-bold text-[#1B5E20] mb-4">
                                    {item.discountType === 'percentage' ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-gray-50">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Successful Uses:</span>
                                        <span className="font-bold text-gray-900">{item.usedCount} / {item.totalLimit > 0 ? item.totalLimit : '∞'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-honey transition-all duration-500"
                                            style={{ width: `${item.totalLimit > 0 ? Math.min(100, (item.usedCount / item.totalLimit) * 100) : 0}%` }}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {item.oneTimePerUser && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold">
                                                <Users className="h-3 w-3" /> 1 Per User
                                            </div>
                                        )}
                                        {item.minSpend > 0 && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold">
                                                <MousePointer2 className="h-3 w-3" /> Min ₹{item.minSpend}
                                            </div>
                                        )}
                                        {item.is_private && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-bold">
                                                <ShieldCheck className="h-3 w-3" /> Private
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2">
                                        {item.startDate && (
                                            <span>Active from: {new Date(`${item.startDate}T${item.startTime || '00:00'}:00`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        )}
                                        <span className="ml-auto">Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
