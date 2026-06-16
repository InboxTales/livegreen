import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, ShoppingCart, Heart, Check, Minus, Plus } from "lucide-react";
import { Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Link } from "react-router-dom";
import { useState } from "react";

interface QuickViewProps {
    product: Product | null;
    onClose: () => void;
}

export default function QuickView({ product, onClose }: QuickViewProps) {
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    if (!product) return null;

    const handleAdd = () => {
        addToCart(product, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <AnimatePresence>
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
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={onClose}
                        className="absolute top-4 right-4 z-20 h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#6B9E6E] hover:text-[#1B5E20] hover:bg-white shadow-sm transition-all cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image */}
                        <div className="aspect-square bg-[#F5FFF5] relative overflow-hidden">
                            <img loading="lazy" decoding="async" src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            {product.originalPrice > product.price && (
                                <div className="absolute top-4 left-4 bg-[#1B5E20] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-inter">
                                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </div>
                            )}
                            <button
                                onClick={() => toggleWishlist(product.id)}
                                className="absolute top-4 right-4 h-10 w-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-110"
                            >
                                <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-[#6B9E6E]"}`} />
                            </button>
                        </div>

                        {/* Info */}
                        <div data-lenis-prevent className="p-8 flex flex-col justify-center overflow-y-auto custom-scrollbar">
                            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-[0.2em] mb-2 font-inter">{product.category}</span>
                            <h2 className="font-serif text-2xl font-bold text-[#1B5E20] mb-3 leading-tight">{product.name}</h2>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex text-[#F5A623]">
                                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                                </div>
                                <span className="text-xs text-[#6B9E6E] font-inter">(128 reviews)</span>
                            </div>

                            <div className="flex items-end gap-3 mb-5">
                                <span className="text-3xl font-bold text-[#1B5E20] font-serif">₹{product.price}</span>
                                {product.originalPrice > product.price && (
                                    <span className="text-base text-[#6B9E6E] line-through font-inter mb-0.5">₹{product.originalPrice}</span>
                                )}
                            </div>

                            <p className="text-sm text-[#4A7C4D] leading-relaxed mb-6 line-clamp-3 font-inter">{product.description}</p>

                            {/* Quantity */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-xs font-semibold text-[#1B5E20] uppercase tracking-wider font-inter">Qty</span>
                                <div className="flex items-center border border-[#CDDBCE] rounded-full overflow-hidden bg-[#FAFAFA]">
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="h-9 w-9 flex items-center justify-center text-[#6B9E6E] hover:bg-[#E8F5E9] cursor-pointer">
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-[#1B5E20]">{quantity}</span>
                                    <button onClick={() => setQuantity(quantity + 1)}
                                        className="h-9 w-9 flex items-center justify-center text-[#6B9E6E] hover:bg-[#E8F5E9] cursor-pointer">
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button 
                                    disabled={product.stock <= 0}
                                    onClick={handleAdd}
                                    className={`btn-primary flex-1 h-12 cursor-pointer inline-flex items-center justify-center gap-2 font-inter text-sm ${added ? "!bg-[#F5A623]" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    {product.stock <= 0 ? "Out of Stock" : (added ? <><Check className="h-4 w-4" /> Added!</> : <><ShoppingCart className="h-4 w-4" /> Add to Cart</>)}
                                </button>
                            </div>

                            <Link to={`/product/${product.id}`} onClick={onClose}
                                className="text-center mt-3 text-xs text-[#6B9E6E] hover:text-[#3A8E3C] underline underline-offset-4 font-inter cursor-pointer">
                                View Full Details →
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
