import React from 'react';
import { motion } from 'framer-motion';
import { Share2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ScanMe = () => {
  return (
    <div className="min-h-screen bg-forest flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-honey/30 to-transparent" />
      
      {/* Navigation */}
      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-honey/60 hover:text-honey transition-colors group z-20"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Home</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 bg-black relative"
        >
          <video 
            src="/videos/WhatsApp Video 2026-03-19 at 16.51.03.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          
          {/* Logo Overlay */}
          <div className="absolute bottom-8 right-8 h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20">
            <img loading="lazy" decoding="async" src="/logo.png" alt="Live Green" className="w-full h-full object-contain invert brightness-0" />
          </div>
        </motion.div>

        {/* Text & Branding */}
        <div className="mt-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="inline-block text-[10px] font-bold text-honey uppercase tracking-[0.4em] mb-4">Live Green Honey</span>
            <h1 className="font-serif text-4xl sm:text-6xl text-white font-bold tracking-tighter mb-6">Experience the Purity</h1>
            <p className="text-cream/50 text-sm sm:text-lg max-w-xl mx-auto font-inter leading-relaxed px-4">
              Step into our world where every jar is a testament to nature's integrity. Witness the journey from high-altitude forests to your family’s table.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
          >
            <Link 
              to="/shop" 
              className="px-10 h-14 bg-honey text-forest font-bold rounded-full uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-white transition-all shadow-xl shadow-honey/10"
            >
              Shop the Collection
            </Link>
            <button 
              className="px-8 h-14 border border-white/20 text-white font-bold rounded-full uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-white/5 transition-all"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Live Green Honey - Purity Harvested',
                    url: window.location.href
                  });
                }
              }}
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20 hidden sm:block">
        <div className="h-24 w-px bg-gradient-to-b from-white to-transparent" />
      </div>
    </div>
  );
};

export default ScanMe;
