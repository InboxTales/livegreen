import React, { useEffect, useRef, useState, useMemo } from "react";
import { Leaf, Droplet, Sun, Truck, Users, Map, Heart, TreePine, ShieldCheck, Star } from "lucide-react";
import { motion, useInView } from "motion/react";
import { getPublicSettings, getGoogleReviews } from "@/lib/api";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
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
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}
export default function About() {
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [googleReviews, setGoogleReviews] = useState<any[]>([]);
  
  useEffect(() => {
    getPublicSettings().then(setSiteSettings);
    getGoogleReviews().then(data => {
      if (data && data.reviews) {
        setGoogleReviews(data.reviews);
      }
    }).catch(err => console.error("Failed to fetch google reviews:", err));
  }, []);

  const stats = useMemo(() => {
    try {
      if (siteSettings.about_stats_json) return JSON.parse(siteSettings.about_stats_json);
    } catch (e) { console.error("Invalid about_stats_json", e); }
    return [
      { value: 50, suffix: "+", label: "Families", icon: "lni lni-users" },
      { value: 100, suffix: "%", label: "Single Origin", icon: "lni lni-map" },
      { value: 5, suffix: "+", label: "Years of Trust", icon: "lni lni-tree" },
      { value: 500, suffix: "+", label: "Happy Homes", icon: "lni lni-heart" },
    ];
  }, [siteSettings.about_stats_json]);

  const philosophy = useMemo(() => {
    try {
      if (siteSettings.about_philosophy_json) return JSON.parse(siteSettings.about_philosophy_json);
    } catch (e) { console.error("Invalid about_philosophy_json", e); }
    return {
      subtitle: "OUR PHILOSOPHY",
      title: "Nurturing Bees, Nurturing Life",
      content: [
        "When we started Live Green, it wasn’t just about honey. We saw bees as quiet heroes, pollinating our neighbors’ fields—helping farmers grow more, from moringa to every crop that depends on these tiny wings. Preserving beekeeping means nurturing an entire ecosystem of growth—for the bees, for the farmers, and for every jar we share with you."
      ]
    };
  }, [siteSettings.about_philosophy_json]);

  const origin = useMemo(() => {
    try {
      if (siteSettings.about_origin_json) return JSON.parse(siteSettings.about_origin_json);
    } catch (e) { console.error("Invalid about_origin_json", e); }
    return {
      title: "Why We Started Live Green",
      paragraphs: [
        "We started Live Green on a personal quest for honest, natural food—something we felt proud to share with our family, from our elders to ourselves. As we searched, we realized many families needed that same trust in what they eat. That’s why we created Live Green—to offer the same pure goodness we believe in. Because your wellness is our joy, and what we trust for our own family is exactly what we share with you."
      ]
    };
  }, [siteSettings.about_origin_json]);

  const timeline = useMemo(() => {
    try {
      if (siteSettings.about_timeline_json) return JSON.parse(siteSettings.about_timeline_json);
    } catch (e) { console.error("Invalid about_timeline_json", e); }
    return [
      { year: "2018", title: "The Discovery", desc: "A trek through Uttarakhand leads to the discovery of authentic, wild-foraged raw honey untouched by modern processing." },
      { year: "2019", title: "First Partnerships", desc: "Forged direct-trade alliances with 10 indigenous beekeeping families, establishing ethical harvesting protocols." },
      { year: "2021", title: "Lab Certification", desc: "Implemented stringent, batch-wise FSSAI and NMR purity testing to guarantee 100% genuine honey." },
      { year: "2024", title: "A Growing Community", desc: "Reached 5,000+ homes across India, expanding the Live Green family and introducing rare medicinal harvests." }
    ];
  }, [siteSettings.about_timeline_json]);

  const team = useMemo(() => {
    try {
      if (siteSettings.about_team_json) return JSON.parse(siteSettings.about_team_json);
    } catch (e) { console.error("Invalid about_team_json", e); }
    return [
      { name: "Sumanth", role: "Founder", img: "/images/IMG_1802.jpg", desc: "" },
      { name: "Venky", role: "Founder", img: "/images/IMG_1814.jpg", desc: "" },
      { name: "Ajay", role: "Founder", img: "/images/IMG_1826.jpg", desc: "" },
      { name: "Venkat", role: "Founder", img: "/images/IMG_1864 (1).jpg", desc: "" }
    ];
  }, [siteSettings.about_team_json]);

  const roadmapSteps = useMemo(() => {
    try {
      if (siteSettings.home_roadmap_json) {
        const parsed = JSON.parse(siteSettings.home_roadmap_json);
        return parsed.map((step: any, idx: number) => ({
          step: `0${idx + 1}`.slice(-2),
          title: step.name,
          desc: step.desc,
          icon: ["lni lni-flower", "lni lni-users", "lni lni-drop", "lni lni-microscope", "lni lni-package", "lni lni-delivery", "lni lni-package", "lni lni-delivery"][idx] || "lni lni-heart",
          image: `/images/step_${idx + 1}.png`
        }));
      }
    } catch (e) { console.error("Invalid home_roadmap_json", e); }
    return [
      { step: "01", title: "Ethical Beekeeping", desc: "Our journey begins with ethical and organic beekeeping practices in pesticide-free environments rich in native flora.", icon: "lni lni-flower", image: "/images/step_1.png" },
      { step: "02", title: "Nectar & Pollen Collection by Bees", desc: "Bees naturally gather nectar and pollen from blooming flowers, creating a rich, golden honey deep within the hives.", icon: "lni lni-users", image: "/images/step_2.png" },
      { step: "03", title: "Bee-friendly Harvesting", desc: "Once the honeycombs are full, our skilled beekeepers gently remove them using smoke-free, non-invasive techniques.", icon: "lni lni-drop", image: "/images/step_3.png" },
      { step: "04", title: "Sustainable Extraction", desc: "We gently extract raw honey using centrifugal methods, ensuring the hive’s eggs and larvae remain safe and undisturbed.", icon: "lni lni-microscope", image: "/images/step_4.png" },
      { step: "05", title: "Natural Filtration", desc: "Raw honey is strained through fine mesh to remove debris and beeswax, keeping nutrients intact. Purifying without losing purity.", icon: "lni lni-package", image: "/images/step_5.png" },
      { step: "06", title: "Quality Testing", desc: "Each batch undergoes lab testing for purity, moisture content, and compliance. Because your truth is our promise.", icon: "lni lni-delivery", image: "/images/step_6.png" },
      { step: "07", title: "Bottling & Eco Packaging", desc: "Each honey jar is hygienically filled, securely sealed, and eco-packed with tamper-proof branding.", icon: "lni lni-package", image: "/images/step_7.png" },
      { step: "08", title: "From Our Hives to Your Home", desc: "Orders are shipped directly from our warehouse using fast and secure logistics.", icon: "lni lni-delivery", image: "/images/step_8.png" },
    ];
  }, [siteSettings.home_roadmap_json]);
  return (
    <div className="bg-[#FAFAFA] overflow-hidden">
      {/* Hero */}
      <div className="relative bg-[#0D3B0E] py-36 sm:py-44 noise-overlay overflow-hidden">
        <div className="absolute inset-0">
          <img loading="lazy" decoding="async" src="/images/himalayan-forest.png" alt="Forest" className="h-full w-full object-cover opacity-15 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D3B0E]/60 to-[#0D3B0E]/95" />
        </div>
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">
            {siteSettings.about_hero_subtitle || "Our Story"}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="font-serif text-5xl font-bold tracking-tight text-white sm:text-7xl">
            {siteSettings.about_hero_title || "Straight From Farm To Family"}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-8 text-sm leading-7 text-white/70 max-w-lg mx-auto font-inter">
            {siteSettings.about_hero_desc || "What we give our family is what we give yours. Every jar at Live Green is packed with care for your family."}
          </motion.p>
        </div>
      </div>

      {/* Testimonials Marquee removed as requested */}

      {/* Story */}
      <section className="py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-[#1B5E20]/10 border-[6px] border-white">
                <img loading="lazy" decoding="async" src="/images/WhatsApp Image 2026-03-19 at 16.16.35.jpeg" alt="Philosophy" className="h-full w-full object-cover" />
              </div>
              {/* <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden md:block border border-[#CDDBCE]/30">
                <p className="font-serif text-lg italic text-[#1B5E20] leading-relaxed">"We believe that nature knows best."</p>
                <p className="mt-3 text-[10px] font-semibold text-[#6B9E6E] uppercase tracking-[0.15em] font-inter">The Team</p>
              </div> */}
              <div className="absolute -top-8 -left-8 h-48 w-48 bg-[#3A8E3C]/5 rounded-full blur-3xl -z-10" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <p className="text-xs font-semibold text-[#3A8E3C] uppercase tracking-[0.2em] mb-4 font-inter">{philosophy.subtitle}</p>
              <h2 className="font-serif text-4xl font-bold text-[#1B5E20] mb-8 leading-tight">{philosophy.title}</h2>
              <div className="space-y-5 text-sm text-[#4A7C4D] leading-relaxed font-inter">
                {philosophy.content.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Origin Story Component */}
      <section className="py-24 bg-[#FAFAFA] relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="order-2 lg:order-1">
              <span className="text-xs font-bold text-[#F5A623] uppercase tracking-widest font-inter">The Origin</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#0D3B0E] mt-4 mb-6 leading-tight">{origin.title}</h2>
              <div className="space-y-4 text-sm text-[#4A7C4D] leading-relaxed font-inter">
                {origin.paragraphs.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative order-1 lg:order-2">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl relative">
                <img loading="lazy" decoding="async" src="/images/IMG_2005.JPG" alt="Expedition" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#0D3B0E]/20" />
              </div>

              {/* <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-[2rem] shadow-xl border border-[#CDDBCE]/30 max-w-[200px] hidden md:block">
                <div className="h-10 w-10 bg-[#F5A623]/20 rounded-full flex items-center justify-center text-[#D35400] mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xl font-bold text-[#0D3B0E] font-serif leading-tight mb-1">Zero Compromise</p>
                <p className="text-[10px] text-[#6B9E6E] font-inter leading-relaxed">We rejected 14 commercial suppliers before finding our forest partners.</p>
              </div> */}
            </motion.div>
          </div>
        </div>
      </section>


      {/* ========== 6. HONEY JOURNEY — Narrative Scroll ========== */}
      {/* 
      <section className="py-32 bg-[#0D3B0E] relative overflow-hidden">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.03]" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="text-center mb-32">
            <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-[0.4em] font-inter">The Harvest Timeline</span>
            <h2 className="font-serif text-5xl sm:text-6xl font-bold text-white mt-6 tracking-tighter">Forest Harvest</h2>
            <p className="text-lg text-[#FFF7E0]/40 mt-6 font-inter max-w-2xl mx-auto italic">"A journey of a thousand blossoms, preserved in a single jar."</p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-12 pb-12">
              {roadmapSteps.map((step, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative group hover:bg-white/10 transition-colors">
                  <div className="absolute top-6 right-6 text-5xl font-black text-white/5 group-hover:text-white/10 transition-colors pointer-events-none font-serif">
                    {step.step}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-[#1B5E20] text-[#F5A623] flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
                    <i className={step.icon}></i>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">{step.title}</h3>
                  <p className="text-sm text-[#FFF7E0]/60 font-inter leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-32 flex justify-center">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-3xl shadow-lg border border-white/20 inline-flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center sm:text-left">
                  <p className="text-sm font-bold text-[#F5A623] uppercase tracking-wider mb-1">Sweet Tip</p>
                  <p className="text-xs text-white/80 font-medium max-w-[200px]">A daily treat! Measure your sweet journey one spoonful at a time.</p>
                </div>
                <div className="h-px w-full sm:h-12 sm:w-[2px] bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-[#F5A623] to-transparent"></div>
                <a 
                  href="https://wa.me/917070324141" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-center sm:text-left hover:opacity-80 transition-opacity"
                >
                  <p className="text-lg font-black text-white font-serif">Order Now on WhatsApp</p>
                  <p className="text-2xl font-bold text-[#4CAF50] flex items-center justify-center sm:justify-start gap-2">
                    <i className="lni lni-whatsapp"></i> 7070324141
                  </p>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* Visual Timeline Component */}
      {/*
      <section className="py-24 bg-white relative">
        <div className="absolute inset-0 honeycomb-pattern opacity-[0.02]" />
        <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <span className="text-xs font-bold text-[#3A8E3C] uppercase tracking-widest font-inter">The Journey So Far</span>
            <h2 className="font-serif text-4xl font-bold text-[#0D3B0E] mt-4">Growth with Integrity</h2>
          </div>

          <div className="relative border-l-2 md:border-l-0 border-[#CDDBCE]/50 ml-4 md:ml-0">
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-[#CDDBCE]/50 hidden md:block ml-[-1px]" />

            <div className="space-y-16">
              {timeline.map((item: any, idx: number) => (
                <div key={idx} className={`relative flex flex-col md:flex-row items-start md:items-center ${idx % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>

                  <div className="absolute left-[-22px] md:left-1/2 w-[40px] h-[40px] rounded-full bg-[#0D3B0E] border-4 border-white shadow-lg md:ml-[-20px] z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-[#F5A623] rounded-full" />
                  </div>

                  <motion.div initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                    className={`pl-8 md:pl-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                    <span className="text-5xl font-black text-[#E8F5E9] block mb-[-20px] font-serif select-none">{item.year}</span>
                    <h3 className="text-2xl font-bold text-[#1B5E20] mb-3 relative z-10">{item.title}</h3>
                    <p className="text-sm text-[#4A7C4D] leading-relaxed font-inter relative z-10">{item.desc}</p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      */}
      {/* Team Section */}
      <section className="py-24 bg-[#FAFAFA] relative border-t border-[#CDDBCE]/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#F5A623] uppercase tracking-widest font-inter">Our Team</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#0D3B0E] mt-4">The Hive Mind</h2>
            <p className="mt-4 text-[#4A7C4D] font-medium text-lg max-w-2xl mx-auto font-inter">The passionate people ensuring every drop of honey is pure, ethical, and raw.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2rem] p-6 shadow-xl shadow-[#1B5E20]/5 border border-[#CDDBCE]/30 text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#E8F5E9] mb-6 group-hover:border-[#F5A623] transition-colors duration-300">
                  <img loading="lazy" decoding="async" src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1B5E20] mb-1">{member.name}</h3>
                <p className="text-xs font-bold text-[#F5A623] uppercase tracking-wider mb-2 font-inter">{member.role}</p>
                {/* <p className="text-sm text-[#4A7C4D] leading-relaxed font-inter px-2">{member.desc}</p> */}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-[#1B5E20] font-serif">Life at the Apiary</h2>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {[
              { type: 'video', url: "/videos/IMG_1765.MOV" },
              { type: 'image', url: "/images/1000581986.jpg" },
              { type: 'video', url: "/videos/IMG_1766.MOV" },
              { type: 'video', url: "/videos/IMG_1768.MOV" },
              { type: 'image', url: "/images/extraction.png" },
              { type: 'video', url: "/videos/IMG_1920.MOV" },
              { type: 'image', url: "/images/WhatsApp Image 2026-03-19 at 16.16.35.jpeg" },
              { type: 'image', url: "/images/IMG_2005.JPG" },
              { type: 'image', url: "/images/image.png" },
            ].map((media, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="relative overflow-hidden rounded-2xl bg-[#E8F5E9] group break-inside-avoid cursor-pointer">
                {media.type === 'video' ? (
                  <video 
                    src={media.url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <img loading="lazy" decoding="async" src={media.url} alt={`Gallery ${idx + 1}`} className="w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-[#0D3B0E]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
