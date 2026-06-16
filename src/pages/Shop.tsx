import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getProducts, Product } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ArrowUpRight, ShoppingCart, SlidersHorizontal, Check, Star, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { useDynamicAccents } from "@/hooks/useDynamicAccents";
import { getPublicSettings } from "@/lib/api";

export default function Shop() {
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");
  const [addedId, setAddedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { setHoneyTheme, resetTheme } = useDynamicAccents();

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getProducts()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load products:", err);
        setLoadError("Could not load products. Please make sure the server is running and try again.");
      })
      .finally(() => setLoading(false));
    getPublicSettings().then(setSiteSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (gridRef.current && products.length > 0) {
      gsap.fromTo(".product-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out" }
      );
    }
  }, [activeCategory, products]);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (product.stock <= 0) return;
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-cream min-h-screen">
      {/* ========== HERO — Minimalist Elegant ========== */}
      <section className="relative pt-48 pb-32 bg-forest overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
        <div className="absolute inset-0 grain opacity-[0.05]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">
              {siteSettings.shop_hero_subtitle || "The Harvest Collection"}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="font-serif text-6xl sm:text-8xl font-bold text-white mt-8 tracking-tighter">
            {siteSettings.shop_hero_title || "Farm to Family"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-10 text-lg text-cream/70 max-w-xl mx-auto font-inter leading-relaxed italic">
            "{siteSettings.shop_hero_desc || "What we give our family is what we give yours. Every jar at Live Green is packed with care for your family."}"
          </motion.p>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      <section className="py-20 bg-cream">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* ========== FILTER BAR — Modern Glass ========== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20 border-b border-forest/5 pb-12">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-forest/5 flex items-center justify-center text-forest">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-widest text-forest/40 font-inter">Filter Collections</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`h-11 px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 font-inter border ${activeCategory === cat
                    ? "bg-forest text-cream border-forest shadow-xl shadow-forest/10"
                    : "bg-white text-forest/40 border-forest/5 hover:border-honey hover:text-honey"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ========== PRODUCT GRID — Premium Cards ========== */}
          <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-10 relative">
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="product-card group relative"
                  onMouseEnter={() => setHoneyTheme(product.category)}
                  onMouseLeave={resetTheme}
                >
                  <Link to={`/product/${product.id}`} className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border border-forest/5 p-1 sm:p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-forest/5 flex flex-col h-full cursor-pointer block">
                    <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] sm:rounded-[2rem] bg-forest/5 relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`h-full w-full object-cover transition-transform duration-700 ${product.stock > 0 ? '' : 'grayscale opacity-50'}`}
                      />
                      <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />

                      {/* Status Badges */}
                      <div className="absolute top-2 left-2 sm:top-6 sm:left-6 flex flex-col gap-1 sm:gap-2">
                        {product.stock <= 0 ? (
                          <div className="bg-rose-600 text-white text-[7px] sm:text-[8px] font-black px-2 py-1 sm:px-4 sm:py-2 rounded-full uppercase tracking-widest shadow-xl">Out of Stock</div>
                        ) : product.originalPrice > product.price ? (
                          <div className="bg-honey text-forest text-[7px] sm:text-[8px] font-black px-2 py-1 sm:px-4 sm:py-2 rounded-full uppercase tracking-widest shadow-xl">Sale</div>
                        ) : null}
                        {product.ribbon && product.ribbon.split(',').map((r: string, rIdx: number) => (
                          <div key={rIdx} className="bg-forest text-honey text-[7px] sm:text-[8px] font-black px-2 py-1 sm:px-4 sm:py-2 rounded-full uppercase tracking-widest shadow-xl border border-honey/20">
                            {r.trim()}
                          </div>
                        ))}
                      </div>

                      {/* Hover Actions (Desktop only) */}
                      {product.stock > 0 && (
                        <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden md:flex gap-3">
                          <button
                            onClick={(e) => { e.preventDefault(); handleAddToCart(e, product); }}
                            className={`flex-1 h-12 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border ${addedId === product.id
                              ? 'bg-forest text-white border-forest'
                              : 'bg-white text-forest border-forest/10 hover:bg-forest hover:text-white'
                              }`}
                          >
                            {addedId === product.id ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                            {addedId === product.id ? 'Added' : 'Reserve Jar'}
                          </button>
                          <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-forest border border-forest/10 hover:bg-honey hover:text-white transition-all">
                            <Eye className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-8 sm:pb-10 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2 sm:mb-4">
                        <span className="text-[8px] sm:text-[10px] font-black text-honey uppercase tracking-widest font-inter">{product.category}</span>
                        <div className="flex items-center gap-1 text-honey">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                          <span className="text-[8px] sm:text-[10px] font-bold text-forest ml-0.5 sm:ml-1 font-inter">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
                        </div>
                      </div>

                      <h3 className="font-serif text-lg sm:text-2xl font-bold text-forest group-hover:text-primary transition-colors leading-tight mb-2 sm:mb-4 line-clamp-2">
                        {product.name}
                      </h3>

                      <div className="mb-4 flex-grow">
                        <p className="text-[9px] sm:text-xs text-forest/70 line-clamp-2 font-inter">
                          {product.description}
                        </p>
                      </div>

                      <div className="mt-auto pt-3 sm:pt-6 border-t border-forest/5 flex flex-col gap-3">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-3xl font-bold font-serif dynamic-accent-text">₹{product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-[10px] sm:text-sm text-forest/30 line-through font-inter italic">₹{product.originalPrice}</span>
                            )}
                          </div>
                          <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-forest/20 group-hover:text-forest transition-colors hidden sm:block" />
                        </div>

                        {/* Mobile Add to Cart Button */}
                        <button
                          onClick={(e) => { e.preventDefault(); handleAddToCart(e, product); }}
                          disabled={product.stock <= 0}
                          className={`w-full font-bold py-2 sm:py-3 rounded-full text-[10px] sm:text-xs tracking-wider uppercase font-inter transition-all ${product.stock <= 0 ? 'bg-gray-100 text-gray-400' :
                            addedId === product.id ? 'bg-forest text-white' : 'bg-honey text-forest hover:bg-forest hover:text-white shadow-sm'
                            } md:hidden flex items-center justify-center gap-1.5`}
                        >
                          {addedId === product.id ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
                          {addedId === product.id ? 'Added' : product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-forest" />
            </div>
          )}

          {!loading && loadError && (
            <div className="text-center py-40">
              <h3 className="font-serif text-2xl font-bold text-forest">Couldn't load products</h3>
              <p className="text-forest/50 mt-4 font-inter text-sm max-w-md mx-auto">{loadError}</p>
              <button onClick={() => window.location.reload()} className="mt-10 text-[10px] font-black uppercase tracking-widest text-honey hover:text-forest transition-colors underline decoration-2 underline-offset-8">
                Retry
              </button>
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="text-center py-40">
              <div className="h-20 w-20 bg-forest/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="h-8 w-8 text-forest/20" />
              </div>
              <h3 className="font-serif text-3xl font-bold text-forest">No harvests found</h3>
              <p className="text-forest/40 mt-4 font-inter text-sm">We're currently scouting for new hives in this category.</p>
              <button onClick={() => setActiveCategory("All")} className="mt-10 text-[10px] font-black uppercase tracking-widest text-honey hover:text-forest transition-colors underline decoration-2 underline-offset-8">
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
