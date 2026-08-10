import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, ArrowRight, User, Heart } from "lucide-react";
import { motion, AnimatePresence, useScroll } from "motion/react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";


const navLinks = [
  { name: "Collection", path: "/shop" },
  { name: "Our Story", path: "/about" },
  { name: "Track Order", path: "/track-order" },
  { name: "Support", path: "/contact" },
];

export default function Navbar() {
  const location = useLocation();
  const { totalQuantity } = useCart();
  const { wishlistIds } = useWishlist();
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setScrolled(latest > 50);
    });
  }, [scrollY]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "circOut" }}
      className="fixed top-0 inset-x-0 z-[100] px-6 py-8"
    >
      <div className="mx-auto max-w-7xl pointer-events-none">
        <motion.nav
          animate={{
            backgroundColor: scrolled ? "rgba(5, 28, 6, 0.95)" : "rgba(252, 249, 241, 0.92)",
            borderColor: scrolled ? "rgba(255, 255, 255, 0.1)" : "rgba(5, 28, 6, 0.1)",
            y: scrolled ? 10 : 0,
            backdropFilter: "blur(20px)",
          }}
          className={`flex h-16 items-center justify-between rounded-full border shadow-2xl pointer-events-auto transition-all duration-700 px-8 relative overflow-hidden`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group relative z-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="h-14 w-14 rounded-full bg-white p-1.5 shadow-xl border border-forest/5 flex items-center justify-center overflow-hidden transition-all duration-500"
            >
              <img loading="lazy" decoding="async" src="/logo.png" alt="Live Green"
                className="h-full w-full object-contain" />
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <div className={`hidden md:flex items-center gap-1 p-1 rounded-full transition-all duration-500 ${scrolled ? "bg-white/5 border border-white/5" : "bg-forest/5 border border-forest/5"
            }`}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.name} to={link.path}
                  className={`relative px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 font-inter rounded-full drop-shadow-sm ${isActive
                    ? (scrolled ? "text-forest" : "text-white")
                    : (scrolled ? "text-white/60 hover:text-white" : "text-forest/70 hover:text-forest")
                    }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.div layoutId="nav-pill"
                      className={`absolute inset-0 rounded-full shadow-lg ${scrolled ? "bg-honey" : "bg-[#1B5E20]"}`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden sm:flex items-center gap-4 mr-4">
              <div className={`h-4 w-px transition-colors duration-500 ${scrolled ? "bg-white/10" : "bg-forest/15"}`} />
            </div>

            {/* Cart & Utils */}
            <div className="flex items-center gap-2">
              <Link to="/wishlist" className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-11 px-6 rounded-full flex items-center gap-4 transition-all duration-500 shadow-sm ${scrolled
                    ? "bg-white/10 text-white hover:bg-rose-500"
                    : "bg-forest/5 text-forest border border-forest/10 hover:bg-rose-500 hover:text-white"
                    }`}
                >
                  <Heart className={`h-4 w-4 ${wishlistIds.length > 0 ? "fill-current text-rose-500" : ""}`} />
                  {wishlistIds.length > 0 && <span className="text-[10px] font-black font-inter tracking-widest">{wishlistIds.length}</span>}
                </motion.div>
              </Link>

              <Link to="/checkout" className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-11 px-6 rounded-full flex items-center gap-4 transition-all duration-500 shadow-xl ${scrolled ? "bg-white text-forest hover:bg-honey" : "bg-[#1B5E20] text-white hover:bg-[#144a18]"
                    }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-[10px] font-black font-inter tracking-widest">{totalQuantity}</span>
                </motion.div>
              </Link>

              {/* Mobile Toggle */}
              <button
                onClick={() => setOpen(!open)}
                className={`md:hidden h-11 w-11 rounded-full flex items-center justify-center transition-all duration-500 ${scrolled ? "bg-white/10 text-white" : "bg-forest/5 text-forest border border-forest/10"
                  } cursor-pointer hover:scale-105 active:scale-95`}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>


          {/* Subtle Decorative Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-honey/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="absolute top-32 inset-x-6 z-[90] md:hidden"
          >
            <div className="bg-forest/95 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl p-8 overflow-hidden relative">
              <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
              <div className="relative z-10 space-y-4">
                {navLinks.map((link) => (
                  <Link key={link.name} to={link.path} onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all font-inter group ${location.pathname === link.path
                      ? "bg-honey text-forest"
                      : "text-white/40 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    {link.name}
                    <ArrowRight className={`h-4 w-4 transition-all ${location.pathname === link.path ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                  </Link>
                ))}
              </div>

              <div className="relative z-10 mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-10">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Live Green</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><User className="h-4 w-4" /></div>
                  <Link to="/wishlist" onClick={() => setOpen(false)} className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${wishlistIds.length > 0 ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 text-white/40"}`}>
                    <Heart className={`h-4 w-4 ${wishlistIds.length > 0 ? "fill-current" : ""}`} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
