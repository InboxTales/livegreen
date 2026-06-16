import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getProducts, Product } from "@/lib/api";
import { Check, X, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Compare() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => { getProducts().then(setProducts); }, []);

    const toggleSelect = (id: number) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev);
    };

    const compareProducts = products.filter((p) => selected.includes(p.id));

    return (
        <div className="bg-[#FAFAFA] min-h-screen">
            <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
                <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Compare</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl">Compare Honey</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">Select up to 3 products to compare side by side.</motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                {/* Product Selector */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12">
                    {products.map((p) => (
                        <button key={p.id} onClick={() => toggleSelect(p.id)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all cursor-pointer font-inter ${selected.includes(p.id) ? "bg-[#1B5E20] text-white shadow-lg" : "bg-white text-[#6B9E6E] border border-[#CDDBCE]/40 hover:bg-[#E8F5E9]"}`}>
                            {selected.includes(p.id) && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* Comparison Table */}
                {compareProducts.length >= 2 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-[#CDDBCE]/30 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto pb-4">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#CDDBCE]/20 bg-gray-50/50">
                                        <th className="p-2 sm:p-6 text-left text-[8px] sm:text-xs font-bold text-[#6B9E6E] uppercase tracking-wider font-inter w-1/4 sm:w-40 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-[#CDDBCE]/20">Feature</th>
                                        <th className="p-2 sm:p-6 text-center text-[8px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider font-inter w-1/4 sm:w-32 bg-gray-50/50 hidden sm:table-cell">Standard Value</th>
                                        {compareProducts.map((p) => (
                                            <th key={p.id} className="p-2 sm:p-6 text-center w-1/4 sm:w-48 align-bottom">
                                                <div className="relative inline-block">
                                                    <img loading="lazy" decoding="async" src={p.image} alt={p.name} className="h-12 w-12 sm:h-24 sm:w-24 rounded-2xl object-cover mx-auto mb-2 sm:mb-3 shadow-sm" />
                                                    <button onClick={() => toggleSelect(p.id)} className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm hover:bg-red-200 transition-colors">
                                                        <X className="h-2 w-2 sm:h-4 sm:w-4" />
                                                    </button>
                                                </div>
                                                <p className="font-serif text-[10px] sm:text-sm font-bold text-[#1B5E20] line-clamp-2 leading-tight">{p.name}</p>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: "Price", std: "N/A", key: "price", render: (p: Product) => <span className="font-bold text-gray-900">₹{p.price}</span> },
                                        { label: "Category", std: "Honey", key: "category", render: (p: Product) => p.category },
                                        { label: "Rating", std: "N/A", key: "rating", render: () => <div className="flex items-center justify-center gap-1 text-honey"><Star className="h-2 w-2 sm:h-4 sm:w-4 fill-current" /> <span className="text-gray-900 font-bold">4.9/5</span></div> },
                                        { label: "Fructose/Glucose", std: "1.0 - 1.2", key: "fg", render: () => <span className="text-forest font-bold">1.1 <span className="hidden sm:inline">(Pass)</span></span> },
                                        { label: "HMF", std: "< 80 mg/kg", key: "hmf", render: () => <span className="text-forest font-bold">12.5 <span className="hidden sm:inline">mg/kg</span></span> },
                                        { label: "Diastase", std: "> 3 Schade units", key: "diastase", render: () => <span className="text-forest font-bold">18 <span className="hidden sm:inline">units</span></span> },
                                        { label: "Moisture", std: "< 20%", key: "moisture", render: () => <span className="text-forest font-bold">16.5%</span> },
                                        { label: "C4 Sugars", std: "< 7%", key: "c4", render: () => <span className="text-forest font-bold">0% <span className="hidden sm:inline">(Pure)</span></span> },
                                        { label: "Raw", std: "Yes", key: "raw", render: () => <span className="text-forest font-bold"><Check className="inline h-4 w-4 mr-1 text-green-500" />Yes</span> },
                                    ].map((row, idx) => (
                                        <tr key={row.key} className={`border-b border-[#CDDBCE]/10 hover:bg-[#F5FFF5] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                            <td className="p-2 sm:p-5 text-[9px] sm:text-xs font-semibold text-[#1B5E20] uppercase tracking-wider font-inter sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-[#CDDBCE]/20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] break-words w-1/4 sm:w-40">{row.label}</td>
                                            <td className="p-2 sm:p-5 text-[9px] sm:text-xs text-gray-500 font-inter text-center bg-gray-50/30 w-1/4 sm:w-32 hidden sm:table-cell">{row.std}</td>
                                            {compareProducts.map((p) => (
                                                <td key={p.id} className="p-2 sm:p-5 text-center text-[10px] sm:text-sm text-[#4A7C4D] font-inter font-medium w-1/4 sm:w-48 break-words">{row.render(p)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-[#CDDBCE]/30">
                        <p className="text-sm text-[#6B9E6E] font-inter">Select at least 2 products to compare.</p>
                    </div>
                )}
            </div>
        </div >
    );
}
