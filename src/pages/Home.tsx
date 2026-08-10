import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "motion/react";
import {
  Calendar, User, Mail, Package, CheckCircle, XCircle,
  PauseCircle, PlayCircle, Clock, RefreshCw, Search, Filter,
  Sparkles, ArrowRight, Play, ShoppingCart, Eye, Star, ArrowUpRight, ShieldCheck, Leaf, FlaskConical, TreePine, Bot, RotateCcw, Award, MoveHorizontal, Check, Truck, AlertTriangle
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { getProducts, Product, getGoogleReviews, GoogleReview } from "@/lib/api";
import VideoModal from "@/components/VideoModal";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ===== Helpers ===== */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / target), 20);
    const timer = setInterval(() => {
      start += Math.ceil(target / (duration / stepTime));
      if (start >= target) { setCount(target); clearInterval(timer); } else setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const trustBadges = [
  { icon: "lni lni-certificate", text: "FSSAI Certified" },
  { icon: "lni lni-shield", text: "Lab Tested" },
  { icon: "lni lni-heart", text: "500+ Customers" },
  { icon: "lni lni-handshake", text: "Ethically Harvested" },
  { icon: "lni lni-star", text: "4.9 Rating" },
  { icon: "lni lni-delivery", text: "Free Shipping" },
  { icon: "lni lni-leaf", text: "100% Natural" },
  { icon: "lni lni-flag", text: "Made in India" },
];

// Static data moved inside component for dynamic control

// Static data moved inside component for dynamic control

// Static data moved inside component for dynamic control

const ugcImages = [
  "/images/multiflora-honey.png",
  "/images/himalayan-forest.png",
  "/images/multiflora-honey.png",
  "/images/multiflora-honey.png",
  "/images/himalayan-forest.png",
  "/images/multiflora-honey.png",
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleAggregate, setGoogleAggregate] = useState({ rating: "5.0", totalReviews: "24", mapsUrl: "" });
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [videoTestimonials, setVideoTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/public_settings')
      .then(r => r.json())
      .then(data => {
        setSiteSettings(data);
      })
      .catch(e => console.error("Failed to load public settings:", e));
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch('/api/video_testimonials');
        const text = await response.text();

        // Strip out any PHP warnings or HTML before the JSON begins
        const jsonStart = text.indexOf('[');
        if (jsonStart !== -1) {
          const jsonText = text.substring(jsonStart);
          const data = JSON.parse(jsonText);
          if (Array.isArray(data) && data.length > 0) {
            setVideoTestimonials(data);
            return;
          }
        }
        
        // Fallback to user's requested specific videos if DB is empty
        setVideoTestimonials([
          { 
            id: 'v1', 
            name: 'Arvind P', 
            location: 'Jagital', 
            title: 'I trust Live Green Honey for my family!', 
            video_url: 'https://youtube.com/shorts/SIzVDLtq66M',
            thumbnail_url: 'https://i.ytimg.com/vi/SIzVDLtq66M/hqdefault.jpg',
            duration: '0:45'
          },
          {
            id: 'v2',
            name: 'Poojitha Pindi',
            location: 'Hyderabad',
            title: 'Organic honey from Live Green! Full of health & Purity!',
            video_url: 'https://youtube.com/shorts/S3Yl-LVRVb4',
            thumbnail_url: 'https://i.ytimg.com/vi/S3Yl-LVRVb4/hqdefault.jpg',
            duration: '1:12'
          },
          {
            id: 'v3',
            name: 'Vinny Gidda',
            location: 'Hyderabad',
            title: 'I trust Live Green Honey for my kid!',
            video_url: 'https://youtube.com/shorts/QW70oYtVMI8',
            thumbnail_url: 'https://i.ytimg.com/vi/QW70oYtVMI8/hqdefault.jpg',
            duration: '0:58'
          }
        ]);
      } catch (error) {
        console.error('Error fetching video testimonials:', error);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => { getProducts().then(setProducts); }, []);
  useEffect(() => {
    getGoogleReviews().then(data => {
      setGoogleReviews(data.reviews);
      setGoogleAggregate(data.aggregate);
    }).catch(() => { });
  }, []);

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gsap-reveal").forEach((el) => {
        gsap.fromTo(el, { y: 30, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" }
        });
      });
      // Roadmap steps
      gsap.utils.toArray<HTMLElement>(".roadmap-step").forEach((el, i) => {
        gsap.fromTo(el, { x: i % 2 === 0 ? -80 : 80, opacity: 0 }, {
          x: 0, opacity: 1, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none none" }
        });
      });
    });
    return () => ctx.revert();
  }, []); // Removed products from dependency array as GSAP context is created once.

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = products.filter(p => p.stock > 0).slice(0, 4);
  const bundleProducts = products.filter(p => p.stock > 0).slice(0, 3);
  const subscriptionProducts = products.filter(p => p.allow_subscription && p.stock > 0);

  const roadmapSteps = React.useMemo(() => {
    if (siteSettings.home_roadmap_json) {
      try {
        return JSON.parse(siteSettings.home_roadmap_json);
      } catch (e) {
        console.error("Failed to parse roadmap JSON:", e);
      }
    }
    return [
      { step: "01", title: "Ethical Beekeeping", desc: "Our journey begins with ethical and organic beekeeping practices in pesticide-free environments.", icon: "lni lni-flower", image: "/images/step_1.png" },
      { step: "02", title: "Nectar & Pollen Collection by Bees", desc: "Bees naturally gather nectar and pollen from blooming flowers, creating a rich, golden honey deep within the hives.", icon: "lni lni-users", image: "/images/step_2.png" },
      { step: "03", title: "Bee-friendly Harvesting", desc: "Once the honeycombs are full, our skilled beekeepers gently remove them using smoke-free, non-invasive techniques.", icon: "lni lni-drop", image: "/images/step_3.png" },
      { step: "04", title: "Sustainable Extraction", desc: "We gently extract raw honey using centrifugal methods, ensuring the hive’s eggs and larvae remain safe and undisturbed.", icon: "lni lni-microscope", image: "/images/step_4.png" },
      { step: "05", title: "Natural Filtration", desc: "Raw honey is strained through fine mesh to remove debris and beeswax, keeping nutrients intact. Purifying without losing purity.", icon: "lni lni-package", image: "/images/step_5.png" },
      { step: "06", title: "Quality Testing", desc: "Each batch undergoes lab testing for purity, moisture content, and compliance. Because your truth is our promise.", icon: "lni lni-delivery", image: "/images/step_6.png" },
      { step: "07", title: "Bottling & Eco Packaging", desc: "Each honey jar is hygienically filled, securely sealed, and eco-packed with tamper-proof branding.", icon: "lni lni-package", image: "/images/step_7.png" },
      { step: "08", title: "From Our Hives to Your Home", desc: "Orders are shipped directly from our warehouse using fast and secure logistics.", icon: "lni lni-delivery", image: "/images/step_8.png" },
    ];
  }, [siteSettings.home_roadmap_json]);

  const comparisonData = React.useMemo(() => {
    if (siteSettings.home_comparison_json) {
      try {
        return JSON.parse(siteSettings.home_comparison_json);
      } catch (e) {
        console.error("Failed to parse comparison JSON:", e);
      }
    }
    return [
      { feature: "Source", ours: "Farms across India", others: "Factory" },
      { feature: "Processing", ours: "Raw & Unprocessed", others: "Ultra Processed" },
      { feature: "Lab Tested", ours: <span><CheckCircle className="inline h-4 w-4 text-green-500 mr-1" /> Yes</span>, others: <span><XCircle className="inline h-4 w-4 text-red-500 mr-1" /> Rarely</span> },
      { feature: "Adulteration", ours: "Never", others: <span><AlertTriangle className="inline h-4 w-4 text-yellow-500 mr-1" /> Sometimes Found</span> },
      { feature: "Packaging", ours: "Glass Jar", others: "Plastic Bottle" },
      { feature: "Heating", ours: "Never heated", others: "Often heated" },
    ];
  }, [siteSettings.home_comparison_json]);

  const testimonials = React.useMemo(() => {
    // 1. Database Google Reviews takes priority
    if (googleReviews && googleReviews.length > 0) {
      return googleReviews.map(r => ({
        name: r.reviewerName,
        role: "Verified Customer",
        text: r.reviewText,
        avatar: r.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewerName)}&background=random`,
        rating: r.rating || 5
      }));
    }

    // 2. Admin JSON override if available
    if (siteSettings.home_testimonials_json) {
      try {
        return JSON.parse(siteSettings.home_testimonials_json);
      } catch (e) {
        console.error("Failed to parse testimonials JSON:", e);
      }
    }

    // 3. Fallback to empty if nothing found
    return [];
  }, [siteSettings.home_testimonials_json, googleReviews]);

  const trustBadges = [
    { icon: "lni lni-certificate", text: "FSSAI Certified" },
    { icon: "lni lni-shield", text: "Lab Tested" },
    { icon: "lni lni-heart", text: `${siteSettings.home_trust_count || "500+"} Customers` },
    { icon: "lni lni-handshake", text: "Ethically Harvested" },
    { icon: "lni lni-star", text: `${siteSettings.home_trust_rating || googleAggregate.rating || "5.0"} Rating` },
    { icon: "lni lni-delivery", text: "Free Shipping" },
    { icon: "lni lni-leaf", text: "100% Natural" },
    { icon: "lni lni-flag", text: "Made in India" },
  ];

  return (
    <div className="bg-[#FAFAFA] overflow-hidden">
      {/* ========== 1. HERO — Cinematic Immersive ========== */}
      <section ref={heroRef} className="relative min-h-[110vh] flex items-center justify-center overflow-hidden bg-forest">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <img src={siteSettings.home_hero_image || "/images/WhatsApp Image 2026-03-19 at 16.16.35.jpeg"} alt="Honey farm" className="h-[120%] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-forest/40 via-forest/80 to-forest" />
          <div className="absolute inset-0 grain opacity-20" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <span className="inline-flex items-center gap-2 bg-honey/10 backdrop-blur-md text-honey text-[9px] font-bold uppercase tracking-[0.4em] px-5 py-2 rounded-full border border-honey/20 mb-10 font-inter">
              Nature in every drop
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1 }}
            className="font-serif text-6xl sm:text-8xl lg:text-[9.5rem] font-bold leading-[0.85] tracking-tight"
            style={{ color: '#FCF9F1' }}>
            <span className="text-glow-honey text-shimmer">{siteSettings.home_hero_title || "Raw Honey"}</span> <br />
            <span className="text-shimmer text-4xl sm:text-5xl lg:text-6xl tracking-normal inline-block mt-4">{siteSettings.home_hero_subtitle || "Straight From Farm To Your Family"}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-10 text-lg sm:text-xl text-cream/70 max-w-2xl mx-auto font-inter leading-relaxed">
            {siteSettings.home_hero_desc || "What we give our family is what we give yours. Raw, natural honey collected with care."}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { label: "Pollen Rich" },
              { label: "Lab Tested" },
              { label: "Unprocessed" },
              { label: "No Adulteration" },
            ].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-cream/80 text-sm sm:text-base font-inter font-medium">
                <Check className="h-4 w-4 text-honey" /> {item.label}
              </span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <Link to="/shop" className="group relative h-16 px-12 bg-honey rounded-full flex items-center gap-3 overflow-hidden shadow-2xl shadow-honey/20">
              <span className="relative z-10 text-forest font-bold uppercase tracking-widest text-xs">Shop Raw Honey</span>
              <ArrowRight className="h-4 w-4 relative z-10 text-forest group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
            <Link to="/about" className="h-16 px-10 rounded-full border border-white/20 text-white text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-white/5 transition-all">
              <Play className="h-4 w-4 fill-current" /> See How We Harvest
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30">
          <div className="h-12 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* ========== 2. TRUST MARQUEE BAR ========== */}
      <section className="bg-forest py-6 overflow-hidden border-y border-white/5 relative">
        <div className="absolute inset-0 bg-honey/5 pointer-events-none" />
        <div className="marquee-track">
          <div className="marquee-content py-2">
            {[...trustBadges, ...trustBadges].map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-3 text-cream/40 text-[10px] uppercase tracking-[0.2em] font-bold font-inter mx-12 whitespace-nowrap">
                <i className={`${badge.icon} text-honey text-sm`}></i>
                {badge.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 3. BESTSELLERS — Modern Grid ========== */}
      <section className="py-32 bg-cream relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="gsap-reveal flex flex-col md:flex-row md:items-end justify-between mb-20">
            <div>
              <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Farm to Family</span>
              <h2 className="font-serif text-5xl sm:text-6xl font-bold text-forest mt-4 tracking-tighter">The Live Green Shop</h2>
            </div>
            <p className="text-sm text-forest/60 max-w-sm font-inter mt-6 md:mt-0 leading-relaxed italic">
              "What we give our family is what we give yours. Every Jar at Live Green is packed with care for your family."
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            {featuredProducts.map((product, idx) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                <Link to={`/product/${product.id}`} className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-forest/5 p-1 sm:p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-forest/5 flex flex-col h-full cursor-pointer block">
                  <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-forest/5 relative">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-forest/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1 sm:gap-2 z-10">
                      {product.ribbon && product.ribbon.split(',').map((r: string, rIdx: number) => (
                        <div key={rIdx} className="bg-forest text-honey text-[7px] sm:text-[8px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-widest shadow-xl border border-honey/20">
                          {r.trim()}
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden md:flex gap-2">
                        <button
                          disabled={product.stock <= 0}
                          onClick={(e) => { e.preventDefault(); addToCart(product, 1); }}
                          className="flex-1 h-11 bg-forest text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-forest/90 shadow-lg shadow-forest/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {product.stock <= 0 ? (
                            "Out of Stock"
                          ) : (
                            <>
                              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Buy
                            </>
                          )}
                        </button>
                      <div className="h-11 w-11 bg-white rounded-full flex items-center justify-center text-forest hover:bg-honey hover:text-white transition-all">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <span className="text-[8px] sm:text-[10px] font-bold text-honey uppercase tracking-widest font-inter">{product.category}</span>
                      <div className="flex items-center gap-0.5 text-honey">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                        <span className="text-[8px] sm:text-[10px] font-bold text-forest ml-0.5 sm:ml-1 font-inter">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
                      </div>
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-bold text-forest group-hover:text-primary transition-colors leading-tight mb-2 sm:mb-4 line-clamp-2">{product.name}</h3>

                    <div className="mb-4 flex-grow">
                      <p className="text-[9px] sm:text-xs text-forest/70 line-clamp-2 font-inter">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-3 sm:pt-4 border-t border-forest/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg sm:text-2xl font-bold text-forest font-serif">₹{product.price}</span>
                        <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-forest/20 group-hover:text-forest transition-colors hidden sm:block" />
                      </div>

                      {/* Mobile Add to Cart Button */}
                      <button
                        disabled={product.stock <= 0}
                        onClick={(e) => { e.preventDefault(); addToCart(product, 1); }}
                        className="w-full bg-honey text-forest font-bold py-2 sm:py-3 rounded-full text-[10px] sm:text-xs tracking-wider uppercase font-inter transition-all hover:bg-forest hover:text-white shadow-sm md:hidden flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.stock <= 0 ? (
                          "Out of Stock"
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-20">
            <Link to="/shop" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-forest hover:text-honey transition-all group">
              Explore Our Collection! <div className="h-10 w-10 rounded-full border border-forest/10 flex items-center justify-center group-hover:border-honey transition-all"><ArrowRight className="h-4 w-4" /></div>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 4. WHY US — Premium Narrative ========== */}
      <section className="py-32 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="gsap-reveal order-2 lg:order-1">
              <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Integrity First</span>
              <h2 className="font-serif text-5xl sm:text-6xl font-bold text-white mt-6 leading-[0.95] tracking-tighter">{siteSettings.home_promise_title || <>Honey You Can Trust For Your Family <br /><span className="text-3xl sm:text-4xl text-cream/70 mt-4 block">Raw Honey. Nothing Added. Nothing Removed.</span></>}</h2>
              <p className="text-lg text-cream/60 mt-8 leading-relaxed font-inter max-w-lg">
                {siteSettings.home_promise_desc || "In a world full of processed honey, we choose the natural way. Our honey comes from our own bee farms, harvested with care and packed without heating/adulteration. What we give our family is what we give yours."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                {[
                  { icon: <ShieldCheck className="h-5 w-5" />, title: "Lab Tested Every Batch", desc: "Purity tested before packing" },
                  { icon: <FlaskConical className="h-5 w-5" />, title: "Raw & Unprocessed", desc: "Natural enzymes preserved" },
                  { icon: <Leaf className="h-5 w-5" />, title: "No Adulteration", desc: "Bees collect nectar naturally" },
                  { icon: <TreePine className="h-5 w-5" />, title: "Glass Jar Packaging", desc: "No plastic contamination" },
                ].map((item, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 group cursor-pointer transition-all duration-500">
                    <div className="text-honey mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <h4 className="text-sm font-bold text-white font-inter tracking-wide uppercase">{item.title}</h4>
                    <p className="text-[11px] text-cream/40 mt-1.5 font-inter leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

              <div className="gsap-reveal relative order-1 lg:order-2">
                {/* Image Composition */}
              <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl">
                <video
                  src="/videos/1773918051_WhatsApp_Video_2026-03-19_at_13.45.14.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-forest/20" />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-6 md:-right-12 bg-white rounded-[2rem] p-8 shadow-2xl border border-forest/5 flex flex-col items-center"
              >
                <div className="h-12 w-12 bg-honey/10 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-honey fill-current" />
                </div>
                <p className="text-4xl font-bold font-serif text-forest tracking-tighter">{siteSettings.home_trust_rating || "4.9"}</p>
                <p className="text-[9px] font-black text-forest/40 uppercase tracking-widest mt-1">Google Rating</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 5. COMPARISON TABLE — Minimalist ========== */}
      <section className="py-32 bg-cream">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="gsap-reveal text-center mb-20">
            <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Transparent by Design</span>
            <h2 className="font-serif text-5xl sm:text-6xl font-bold text-forest mt-4 tracking-tighter">Why Live Green?</h2>
          </div>
          <div className="gsap-reveal bg-white rounded-3xl sm:rounded-[3rem] overflow-hidden border border-forest/5 shadow-2xl shadow-forest/5">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-forest/5 border-b border-forest/10">
                    <th className="p-3 sm:p-8 text-left text-[8px] sm:text-[10px] font-black text-forest/40 uppercase tracking-widest font-inter w-1/3">Feature</th>
                    <th className="p-3 sm:p-8 text-center bg-forest text-cream w-1/3">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest font-inter">Live Green</span>
                    </th>
                    <th className="p-3 sm:p-8 text-center text-[8px] sm:text-[10px] font-black text-forest/40 uppercase tracking-widest font-inter w-1/3">Regular Honey</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, i) => (
                    <tr key={i} className="group border-b border-forest/5 hover:bg-forest/[0.02] transition-colors">
                      <td className="p-3 sm:p-8 text-xs sm:text-sm font-bold text-forest font-inter break-words">{row.feature}</td>
                      <td className="p-3 sm:p-8 text-center text-xs sm:text-sm font-bold text-forest bg-forest/5 font-inter break-words">{row.ours}</td>
                      <td className="p-3 sm:p-8 text-center text-xs sm:text-sm text-forest/40 font-inter break-words">{row.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 6. HONEY JOURNEY — Narrative Scroll ========== */}
      <section className="py-32 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="gsap-reveal text-center mb-32">
            <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">The Harvest Timeline</span>
            <h2 className="font-serif text-5xl sm:text-6xl font-bold text-white mt-6 tracking-tighter">Wild Origins</h2>
            <p className="text-lg text-cream/40 mt-6 font-inter max-w-2xl mx-auto italic">"A journey from blossom to jar."</p>
          </div>

          <div className="relative">
            {/* Desktop 2-Row Grid Layout */}
            <div className="hidden lg:block relative space-y-32">
              {/* Connection Lines for Desktop */}
              <div className="absolute top-[80px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-honey/30 to-honey/30 z-0" />
              <div className="absolute top-[80px] right-[12.5%] h-[calc(100%+128px)] w-px bg-honey/30 z-0" />
              <div className="absolute bottom-[80px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-l from-transparent via-honey/30 to-honey/30 z-0" />

              {/* Row 1: Left to Right (Steps 1-4) */}
              <div className="grid grid-cols-4 gap-8 relative z-10">
                {roadmapSteps.slice(0, 4).map((step, idx) => (
                  <div key={idx} className="gsap-reveal roadmap-step flex flex-col items-center text-center">
                    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden mb-8 border border-white/10 group shadow-2xl">
                      <img src={step.image} alt={step.title} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-forest/20 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-6">
                        <span className="text-honey font-serif text-2xl italic">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-4 leading-tight min-h-[3rem]">{step.title}</h3>
                    <p className="text-sm text-cream/60 font-inter leading-relaxed line-clamp-4">{step.desc}</p>
                  </div>
                ))}
              </div>

              {/* Row 2: Right to Left (Steps 5-8 visually 8-5) */}
              <div className="grid grid-cols-4 gap-8 relative z-10">
                {[...roadmapSteps.slice(4)].reverse().map((step, idx) => (
                  <div key={idx} className="gsap-reveal roadmap-step flex flex-col items-center text-center">
                    <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden mb-8 border border-white/10 group shadow-2xl">
                      <img src={step.image} alt={step.title} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-forest/20 mix-blend-multiply" />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest to-transparent opacity-60" />
                      <div className="absolute bottom-4 left-6">
                        <span className="text-honey font-serif text-2xl italic">{step.step}</span>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-white mb-4 leading-tight min-h-[3rem]">{step.title}</h3>
                    <p className="text-sm text-cream/60 font-inter leading-relaxed line-clamp-4">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tablet & Mobile: Vertical Stack (Original Style) */}
            <div className="lg:hidden space-y-24">
              {roadmapSteps.map((step, idx) => (
                <div key={idx} className="gsap-reveal roadmap-step relative">
                  <div className="flex flex-col gap-8">
                    {/* Image Block */}
                    <div className="w-full group">
                      <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                        <img src={step.image} alt={step.title} className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-forest/20 mix-blend-multiply" />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest to-transparent opacity-60" />
                        <div className="absolute bottom-6 left-8">
                          <span className="text-honey font-serif text-3xl italic">{step.step}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Block */}
                    <div className="w-full text-center px-4">
                      <h3 className="font-serif text-3xl font-bold text-white mb-4 leading-tight">{step.title}</h3>
                      <p className="text-base text-cream/70 font-inter leading-relaxed max-w-md mx-auto">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ========== 7B. VIDEO TESTIMONIALS — Cinematic Grid ========== */}
      <section className="py-32 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="gsap-reveal text-center mb-20">
            <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Real Stories</span>
            <h2 className="font-serif text-5xl sm:text-6xl font-bold text-white mt-6 tracking-tighter">Watch our live green family share their honey journey.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 sm:gap-6 lg:h-[600px]">
            {/* We ensure there are exactly 3 slots to maintain the Bento box design. If not enough real videos, we pad with fallbacks. */}
            {(() => {
              const fallbacks = [
                {
                  name: "Arvind P",
                  location: "Jagital",
                  title: "I trust Live Green Honey for my family!",
                  video_url: "https://youtube.com/shorts/SIzVDLtq66M",
                  thumbnail: "https://i.ytimg.com/vi/SIzVDLtq66M/hqdefault.jpg",
                  duration: "0:45"
                },
                {
                  name: "Poojitha Pindi",
                  location: "Hyderabad",
                  title: "Organic honey from Live Green! Full of health & Purity!",
                  video_url: "https://youtube.com/shorts/S3Yl-LVRVb4",
                  thumbnail: "https://i.ytimg.com/vi/S3Yl-LVRVb4/hqdefault.jpg",
                  duration: "1:12"
                },
                {
                  name: "Vinny Gidda",
                  location: "Hyderabad",
                  title: "I trust Live Green Honey for my kid!",
                  video_url: "https://youtube.com/shorts/QW70oYtVMI8",
                  thumbnail: "https://i.ytimg.com/vi/QW70oYtVMI8/hqdefault.jpg",
                  duration: "0:58"
                }
              ];

              // Use admin-managed testimonials if present, otherwise the YouTube fallbacks.
              const displayVideos = videoTestimonials.length >= 3 ? [...videoTestimonials] : fallbacks;

              return displayVideos.slice(0, 3);
            })().map((video, idx) => {

              // Apply specific classes based on the index to create the Bento layout
              let layoutProps = { className: "", playSize: "h-14 w-14 sm:h-16 sm:w-16", iconSize: "h-6 w-6 sm:h-8 sm:w-8", padded: "p-6", titleSize: "text-lg sm:text-xl" };
              if (idx === 0) {
                layoutProps = { className: "md:col-span-8 md:row-span-2 aspect-[4/5] md:aspect-auto", playSize: "h-20 w-20 sm:h-24 sm:w-24", iconSize: "h-8 w-8 sm:h-10 sm:w-10", padded: "p-6 sm:p-10", titleSize: "text-2xl sm:text-4xl" };
              } else {
                layoutProps = { className: "md:col-span-4 md:row-span-1 aspect-[16/9] md:aspect-auto", playSize: "h-14 w-14 sm:h-16 sm:w-16", iconSize: "h-6 w-6 sm:h-8 sm:w-8", padded: "p-6", titleSize: "text-lg sm:text-xl" };
              }

              return (
                <motion.div
                  key={video.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
                  className={`group cursor-pointer relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl ${layoutProps.className}`}
                  onClick={() => setActiveVideoUrl(video.video_url || video.url)}
                >
                  {(video.thumbnail_url || video.thumbnail || "/images/step_1.png").endsWith('.mp4') ? (
                    <video
                      src={video.thumbnail_url || video.thumbnail}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={video.thumbnail_url || video.thumbnail || "/images/step_1.png"}
                      alt={video.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`${layoutProps.playSize} rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-honey transition-all duration-500 shadow-2xl`}>
                      <Play className={`${layoutProps.iconSize} text-white fill-current ml-1 md:ml-2 group-hover:text-forest transition-colors`} />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-5 right-5 sm:top-6 sm:right-6 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full font-inter">
                    {video.duration}
                  </div>

                  {/* Info */}
                  <div className={`absolute bottom-0 left-0 right-0 ${layoutProps.padded}`}>
                    <h3 className={`text-white font-serif font-bold leading-tight mb-4 ${layoutProps.titleSize}`}>"{video.title}"</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-honey/20 border border-honey/30 flex items-center justify-center text-honey text-[10px] font-bold font-inter backdrop-blur-sm">
                        {video.name[0]}
                      </div>
                      <div>
                        <p className="text-white/90 text-xs font-bold font-inter">{video.name}</p>
                        <p className="text-white/40 text-[10px] font-inter uppercase tracking-wide">{video.location}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Remaining Videos Grid - Horizontal Scroll */}
          {videoTestimonials.length > 3 && (
            <div className="mt-12 -mx-6 px-6 sm:-mx-8 sm:px-8 relative group">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex gap-2">
                  <div className="h-1 w-8 bg-honey rounded-full" />
                  <div className="h-1 w-4 bg-forest/10 rounded-full" />
                  <div className="h-1 w-2 bg-forest/5 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-forest/40 uppercase tracking-widest flex items-center gap-2">
                  <MoveHorizontal className="h-3 w-3 animate-pulse" />
                  Drag to Explore
                </span>
              </div>

              <div className="overflow-x-auto pb-10 hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing">
                <div className="flex gap-4 sm:gap-6 w-max px-2">
                  {videoTestimonials.slice(3).map((video, idx) => (
                    <motion.div
                      key={video.id || `extra-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
                      className="group/item cursor-pointer relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-xl w-[300px] sm:w-[340px] aspect-[4/5] flex-shrink-0 snap-center"
                      onClick={() => setActiveVideoUrl(video.video_url || video.url)}
                    >
                      <img src={video.thumbnail_url || video.thumbnail || "/images/step_1.png"} alt={video.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-honey transition-all duration-500 shadow-xl">
                          <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-current ml-1 group-hover:text-forest transition-colors" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full font-inter">
                        {video.duration}
                      </div>

                      {/* Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white font-serif font-bold leading-tight mb-3 text-lg">"{video.title}"</h3>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-honey/20 border border-honey/30 flex items-center justify-center text-honey text-[10px] font-bold font-inter backdrop-blur-sm">
                            {video.name[0]}
                          </div>
                          <div>
                            <p className="text-white/90 text-xs font-bold font-inter">{video.name}</p>
                            <p className="text-white/40 text-[10px] font-inter uppercase tracking-wide">{video.location}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {videoTestimonials.length <= 3 && (
            <div className="text-center mt-16">
              <p className="text-cream/20 text-[10px] font-black uppercase tracking-widest">More video testimonials coming soon</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== 7.5 GOOGLE REVIEWS ========== */}
      <section className="py-24 bg-white relative overflow-hidden border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <svg className="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-gray-800 font-bold ml-1 font-inter text-sm sm:text-base">5.0</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest tracking-tighter leading-tight">Authentic Experiences</h2>
              <p className="mt-4 text-sm font-inter text-gray-500">Read what our community has to say about their journey with Live Green Honey.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {googleReviews.slice(0, 4).map((review: any, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-2xl border border-gray-100 flex flex-col justify-between hover:bg-white hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 bg-forest text-honey rounded-full flex items-center justify-center font-bold font-serif text-lg overflow-hidden">
                      {review.profilePhoto && review.profilePhoto.length > 1 ? (
                        <img src={review.profilePhoto} alt={review.reviewerName} className="h-full w-full object-cover" />
                      ) : (
                        review.profilePhoto || (review.reviewerName ? review.reviewerName[0] : "L")
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm font-inter">{review.reviewerName}</p>
                      <p className="text-xs text-gray-500 font-inter">{review.reviewDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-3 w-3 ${star <= (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed font-inter italic line-clamp-4">"{review.reviewText}"</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/50">
                  <svg className="h-4 w-4 opacity-50 grayscale" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ========== 8. RAW AUTHENTICITY — Premium Layout ========== */}
      <section className="py-24 bg-forest relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="gsap-reveal flex flex-col gap-6 md:block">
            {/* Mobile Image Card */}
            <div className="w-full aspect-video sm:aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/5 relative md:hidden shadow-2xl">
              <img src="/images/image.png" alt="Our Promise" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
            </div>

            {/* Main Content Card */}
            <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] md:rounded-[4rem] p-6 sm:p-8 md:p-20 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-honey/30 to-transparent md:hidden" />
              {/* Desktop Image Background */}
              <div className="hidden md:block absolute top-0 right-0 w-1/2 h-full opacity-50 pointer-events-none">
                <img src="/images/image.png" alt="Honey jars" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-forest/40 to-forest pointer-events-none" />
              </div>

              <div className="md:max-w-xl relative z-10">
                <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Our Promise</span>
                <h2 className="font-serif text-4xl sm:text-7xl font-bold text-white mt-4 sm:mt-8 leading-[1.1] sm:leading-[0.9] tracking-tighter" dangerouslySetInnerHTML={{ __html: siteSettings.home_promise_2_title || "Honey You Can Trust<br />For Your Family" }} />
                <p className="text-sm sm:text-lg text-cream/70 mt-6 sm:mt-8 font-inter leading-relaxed">
                  {siteSettings.home_promise_2_desc || "What we give our family is what we give yours."}
                </p>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "Lab Tested Every Batch", desc: "Purity tested before packing" },
                  { title: "Raw & Unprocessed", desc: "Natural enzymes preserved" },
                  { title: "No Adulteration", desc: "Bees collect nectar naturally" },
                  { title: "Glass Jar Packaging", desc: "No plastic contamination" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                    <CheckCircle className="h-5 w-5 text-honey shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white font-inter">{item.title}</h4>
                      <p className="text-xs text-cream/60 mt-1 font-inter">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 9. SUBSCRIBE & SAVE — Clean CTA ========== */}
      {false && subscriptionProducts.length > 0 && (
        <>
          {/* Subscription Specific Products Showcase */}
          <section className="py-32 bg-cream relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="gsap-reveal flex flex-col md:flex-row md:items-end justify-between mb-20">
                <div>
                  <span className="text-[10px] font-bold text-honey uppercase tracking-[0.4em] font-inter">Monthly Rituals</span>
                  <h2 className="font-serif text-5xl sm:text-6xl font-bold text-forest mt-4 tracking-tighter">Available for Subscription</h2>
                </div>
                <p className="text-sm text-forest/60 max-w-sm font-inter mt-6 md:mt-0 leading-relaxed italic">
                  "Ensure a steady supply of health. Subscribe to your favorite jars and get them delivered automatically."
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
                {subscriptionProducts.map((product, idx) => (
                  <motion.div key={`sub-${product.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative"
                  >
                    <Link to={`/product/${product.id}`} className="bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-forest/5 p-1 sm:p-2 transition-all duration-500 hover:shadow-2xl hover:shadow-forest/5 flex flex-col h-full cursor-pointer block ring-1 ring-honey/20 hover:ring-honey/50">
                      <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem] bg-forest/5 relative">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" />

                        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-honey/90 backdrop-blur-md text-forest text-[7px] sm:text-[8px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                          {product.subscription_discount ? `${product.subscription_discount}% OFF SUBSCRIPTION` : 'SUBSCRIBE & SAVE'}
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hidden md:flex gap-2">
                          <button disabled={product.stock <= 0} onClick={(e) => { e.preventDefault(); addToCart({ ...product, isSubscription: true }, 1); }} className="flex-1 h-11 bg-honey text-forest rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg shadow-honey/20 disabled:opacity-50 disabled:cursor-not-allowed">
                            {product.stock <= 0 ? "Out of Stock" : (<><ShoppingCart className="h-3.5 w-3.5" /> Subscribe</>)}
                          </button>
                        </div>
                      </div>
                      <div className="p-3 sm:p-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                          <span className="text-[8px] sm:text-[10px] font-bold text-honey uppercase tracking-widest font-inter">{product.category}</span>
                          <div className="bg-forest/5 px-2 py-0.5 rounded text-[8px] font-black text-forest uppercase tracking-widest flex items-center gap-1">
                            <RefreshCw className="h-2 w-2" /> Auto-Renew
                          </div>
                        </div>

                        <h3 className="font-serif text-lg sm:text-xl font-bold text-forest group-hover:text-primary transition-colors leading-tight mb-2 sm:mb-4 line-clamp-2">{product.name}</h3>

                        <div className="mt-auto pt-3 sm:pt-4 border-t border-forest/5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg sm:text-2xl font-bold text-forest font-serif">₹{product.subscription_discount ? Math.round(product.price * (1 - product.subscription_discount / 100)) : product.price}</span>
                              {product.subscription_discount && <span className="text-xs text-forest/40 line-through ml-2 font-inter">₹{product.price}</span>}
                            </div>
                            <span className="text-[10px] font-bold text-forest/40 uppercase tracking-widest">/ Delivery</span>
                          </div>

                          {/* Mobile Subscribe Button */}
                                    <button
                          disabled={product.stock <= 0}
                          onClick={(e) => { e.preventDefault(); addToCart({ ...product, price: Math.round(product.price * 0.9) }, 1, true, "Monthly"); }}
                          className="w-full bg-honey text-forest font-bold py-2 sm:py-3 rounded-full text-[10px] sm:text-xs tracking-wider uppercase font-inter transition-all hover:bg-forest hover:text-white shadow-sm md:hidden flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {product.stock <= 0 ? "Out of Stock" : (<><ShoppingCart className="h-3 w-3" /> Subscribe Now</>)}
                        </button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}



      <VideoModal
        isOpen={!!activeVideoUrl}
        onClose={() => setActiveVideoUrl(null)}
        videoUrl={activeVideoUrl || ""}
      />

      {/* ========== QUICK PROMISES BAR ========== */}
      <section className="py-16 bg-[#FAFAFA] border-y border-[#CDDBCE]/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Truck className="h-6 w-6" />, title: "Free Shipping", desc: "On all orders across India" },
              { icon: <RotateCcw className="h-6 w-6" />, title: "30-Day Returns", desc: "No questions asked guarantee" },
              { icon: <ShieldCheck className="h-6 w-6" />, title: "Lab Tested", desc: "Verified for absolute purity" },
              { icon: <Award className="h-6 w-6" />, title: "Premium Quality", desc: "FSSAI certified & ethically sourced" },
            ].map((item, i) => (
              <motion.div key={i} whileHover={{ y: -5 }} className="bg-white rounded-[2rem] p-6 flex items-center gap-4 border border-[#CDDBCE]/30 shadow-sm cursor-pointer group hover-glow transition-all duration-300">
                <div className="h-14 w-14 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-[#3A8E3C] shadow-inner group-hover:bg-[#1B5E20] group-hover:text-white transition-colors">{item.icon}</div>
                <div>
                  <h4 className="text-sm font-bold text-[#1B5E20] font-inter">{item.title}</h4>
                  <p className="text-[11px] text-[#6B9E6E] mt-1 font-inter leading-tight">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 11. WHATSAPP COMMUNITY — Elegant Invite ========== */}
      <section className="py-32 bg-cream">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="gsap-reveal bg-white rounded-[4rem] p-12 md:p-20 shadow-2xl shadow-forest/5 border border-forest/5 relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-20 bg-honey rounded-full" />

            <span className="text-[10px] font-black text-honey uppercase tracking-[0.4em] font-inter">Join The Inner Circle</span>
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-forest mt-8 tracking-tighter">Live Green Community</h2>
            <p className="text-lg text-forest/60 mt-8 font-inter max-w-md mx-auto leading-relaxed">
              Connect directly with our founders, get first access to rare harvests, and learn about the purest way of living.
            </p>

            <a
              href="https://chat.whatsapp.com/CIWQCcAPa6q2mLnoXQJoj4"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 group relative h-16 px-10 bg-[#25D366] text-white rounded-full overflow-hidden shadow-2xl shadow-[#25D366]/20 flex items-center justify-center gap-4 hover:scale-105 transition-all inline-flex"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-6 w-6 brightness-0 invert" />
              <span className="relative z-10 font-black uppercase tracking-[0.1em] text-xs">Join our WhatsApp Group</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </a>

            <p className="text-[10px] text-forest/20 mt-8 uppercase tracking-widest font-black">No Spam. Just Pure Value.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
