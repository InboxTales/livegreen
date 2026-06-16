import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, Check } from "lucide-react";

interface LabReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    productName?: string;
}

export default function LabReportModal({ isOpen, onClose, productName = "Raw Honey" }: LabReportModalProps) {
    const reportData = [
        { parameter: "Moisture Content", result: "17.8%", standard: "≤ 20%", status: "pass" },
        { parameter: "Sucrose Content", result: "2.1%", standard: "≤ 5%", status: "pass" },
        { parameter: "HMF (mg/kg)", result: "12.4", standard: "≤ 40", status: "pass" },
        { parameter: "Diastase Number", result: "15.2", standard: "≥ 8", status: "pass" },
        { parameter: "Reducing Sugars", result: "72.5%", standard: "≥ 65%", status: "pass" },
        { parameter: "Water Insoluble Solids", result: "0.03%", standard: "≤ 0.1%", status: "pass" },
        { parameter: "Electrical Conductivity", result: "0.42 mS/cm", standard: "≤ 0.8", status: "pass" },
        { parameter: "Antibiotics", result: "Not Detected", standard: "Absent", status: "pass" },
        { parameter: "Pesticides", result: "Not Detected", standard: "Absent", status: "pass" },
        { parameter: "Heavy Metals (Pb)", result: "< 0.05 ppm", standard: "≤ 1.0 ppm", status: "pass" },
        { parameter: "Purity Authenticity", result: "Authentic", standard: "Authentic", status: "pass" },
        { parameter: "C4 Sugar Test", result: "Negative", standard: "Negative", status: "pass" },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-[#0D3B0E] px-8 py-6 relative overflow-hidden">
                            <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                            <button onClick={onClose}
                                className="absolute top-4 right-4 h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 cursor-pointer transition-all">
                                <X className="h-4 w-4" />
                            </button>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-[#F5A623]" />
                                </div>
                                <div>
                                    <h2 className="text-white font-serif text-xl font-bold">Lab Test Report</h2>
                                    <p className="text-white/70 text-xs font-inter mt-0.5">{productName} — Batch #LGH-2024-0847</p>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="px-8 py-4 border-b border-[#CDDBCE]/20 flex items-center gap-3 flex-wrap">
                            {["FSSAI Certified", "Lab Tested", "ISO 9001", "100% Authentic"].map((badge) => (
                                <span key={badge} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3A8E3C] bg-[#E8F5E9] px-3 py-1 rounded-full uppercase tracking-wider font-inter">
                                    <Check className="h-3 w-3" /> {badge}
                                </span>
                            ))}
                        </div>

                        {/* Table */}
                        <div data-lenis-prevent className="overflow-y-auto max-h-[50vh] px-8 py-4">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#CDDBCE]/30">
                                        <th className="text-left text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider py-3 font-inter">Parameter</th>
                                        <th className="text-left text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider py-3 font-inter">Result</th>
                                        <th className="text-left text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider py-3 font-inter">Standard</th>
                                        <th className="text-right text-[10px] font-bold text-[#6B9E6E] uppercase tracking-wider py-3 font-inter">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="border-b border-[#CDDBCE]/15 hover:bg-[#F5FFF5] transition-colors">
                                            <td className="py-3 text-sm font-medium text-[#1B5E20] font-inter">{row.parameter}</td>
                                            <td className="py-3 text-sm text-[#4A7C4D] font-inter font-semibold">{row.result}</td>
                                            <td className="py-3 text-xs text-[#6B9E6E] font-inter">{row.standard}</td>
                                            <td className="py-3 text-right">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3A8E3C] bg-[#E8F5E9] px-2 py-0.5 rounded-full font-inter">
                                                    <Check className="h-3 w-3" /> Pass
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 border-t border-[#CDDBCE]/20 flex items-center justify-center bg-[#FAFAFA]">
                            <p className="text-[10px] text-[#6B9E6E] font-inter">Tested by National Dairy Research Institute (NDRI)</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
