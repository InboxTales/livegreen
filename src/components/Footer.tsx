import { Link } from "react-router-dom";
import { ArrowUpRight, Instagram, Facebook, Twitter, Mail, MapPin, Phone, ArrowRight, Sparkles, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { motion } from "motion/react";

export default function Footer() {
  return (
    <footer className="bg-forest pt-32 pb-16 relative overflow-hidden text-cream selection:bg-honey selection:text-forest">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Background decorations */}
      <div className="absolute inset-0 honeycomb-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-honey/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-white/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-32 mb-32">
          {/* Brand & Mission */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-4 mb-10 group">
              <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center p-3 transition-transform duration-700 group-hover:rotate-[360deg] shadow-2xl">
                <img loading="lazy" decoding="async" src="/logo.png" alt="LG" className="h-full w-auto" />
              </div>
              <span className="font-serif text-4xl font-bold tracking-tighter">Live Green</span>
            </Link>
            <p className="text-2xl font-serif leading-[1.3] text-cream/80 max-w-md italic">
              "What we give our family is what we give yours."
            </p>

            <div className="mt-12 flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cream/20">Follow Us</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="mt-8 flex gap-4">
              {[
                { Icon: Instagram, href: "https://instagram.com/livegreenfarms" },
                { Icon: Facebook, href: "https://facebook.com/livegreenfarms" },
                { Icon: Twitter, href: "https://twitter.com/livegreenfarms" },
                { Icon: () => <img loading="lazy" decoding="async" src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="h-5 w-5" alt="WA" />, href: "https://chat.whatsapp.com/CIWQCcAPa6q2mLnoXQJoj4" }
              ].map((item, i) => (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="h-14 w-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-honey hover:text-forest transition-all duration-500 group relative overflow-hidden">
                  <div className="relative z-10 transition-transform group-hover:scale-110">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-16">

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-honey">Learn More</h4>
              <ul className="space-y-5">
                {[["Our Philosophy", "/about"], ["The Beekeepers", "/about"], ["Harvest Notes", "/blogs"], ["Lab Integrity", "/about"]].map(([label, path]) => (
                  <li key={label}>
                    <Link to={path} className="text-[11px] font-black uppercase tracking-[0.15em] text-cream/50 hover:text-white transition-all inline-flex items-center group">
                      {label} <ArrowUpRight className="h-3 w-3 ml-2 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-honey" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-honey">Outpost</h4>
              <ul className="space-y-6">
                <li className="flex items-start gap-4 group">
                  <MapPin className="h-4 w-4 text-honey flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-cream/50 leading-relaxed group-hover:text-white transition-colors">Geeta Hospital Road, Sajjapuram,<br />Tanuku, West Godavari,<br />Andhra Pradesh - 534211</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <Mail className="h-4 w-4 text-honey flex-shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-cream/50 group-hover:text-white transition-colors">info@livegreenfarms.in</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-cream/50 group-hover:text-white transition-colors">+91 70703 24141 (24/7)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cinematic Branding */}
        <div className="relative mb-20 select-none pointer-events-none">
          <div className="overflow-hidden">
            <h2 className="text-[16vw] font-bold leading-none text-white/[0.02] whitespace-nowrap font-serif tracking-tighter text-center">
              PURE RAW HONEY
            </h2>
          </div>
        </div>

        {/* Global Footer Bottom */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              &copy; {new Date().getFullYear()} Live Green Farms.
            </p>
            <div className="flex gap-10">
              <span className="text-[10px] font-black text-white/10 hover:text-white/30 cursor-pointer uppercase tracking-[0.2em] transition-all">Privacy Policy</span>
              <span className="text-[10px] font-black text-white/10 hover:text-white/30 cursor-pointer uppercase tracking-[0.2em] transition-all">Terms of Service</span>
            </div>
          </div>

          <div className="flex gap-4">
            <a href="https://wa.me/917070324141" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 hover:bg-honey hover:text-forest px-6 py-3 rounded-full border border-white/5 transition-all group">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cream/80 group-hover:text-forest">Chat with us on WhatsApp</span>
              <img loading="lazy" decoding="async" src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-4 w-4 opacity-80 group-hover:opacity-100" />
            </a>
            <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/5 hidden sm:flex">
              <div className="h-2 w-2 rounded-full bg-honey animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cream/40">Secure Server</span>
            </div>
          </div>
        </div>
      </div>
    </footer >
  );
}
