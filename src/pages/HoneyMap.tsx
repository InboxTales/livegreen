import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { MapPin, Leaf, Thermometer, Mountain, Target } from "lucide-react";
import gsap from "gsap";
import { getPublicSettings } from "@/lib/api";

export default function HoneyMap() {
    const [siteSettings, setSiteSettings] = useState<any>({});
    const [selected, setSelected] = useState<any>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getPublicSettings().then(setSiteSettings);
    }, []);

    const sourceLocations = useMemo(() => {
        try {
            if (siteSettings.honey_map_json) return JSON.parse(siteSettings.honey_map_json);
        } catch (e) { console.error("Invalid honey_map_json", e); }
        return [
            { id: 1, name: "Uttarakhand", coords: { top: "22%", left: "52%" }, types: ["Wild Forest Honey", "Litchi Honey"], altitude: "1,500-3,000m", flora: "Rhododendron, Wild Berries, Pine", temp: "8-25°C", description: "Pristine Himalayan forests with diverse wildflowers and medicinal herbs. Our primary sourcing region.", image: "/images/himalayan-forest.png", featured: true },
            { id: 2, name: "Sundarbans, West Bengal", coords: { top: "45%", left: "75%" }, types: ["Mangrove Honey"], altitude: "Sea Level", flora: "Khalsi, Keora, Goran", temp: "20-35°C", description: "The world's largest mangrove forest produces a uniquely mineral-rich honey.", image: "/images/himalayan-forest.png", featured: false },
            { id: 3, name: "Nilgiris, Tamil Nadu", coords: { top: "75%", left: "48%" }, types: ["Multi-Flora Honey"], altitude: "1,000-2,600m", flora: "Eucalyptus, Tea, Shola", temp: "10-25°C", description: "Blue Mountains produce a subtle, aromatic honey with eucalyptus notes.", image: "/images/multiflora-honey.png", featured: false },
            { id: 4, name: "Western Ghats, Kerala", coords: { top: "80%", left: "42%" }, types: ["Stingless Bee Honey", "Rubber Honey"], altitude: "500-2,000m", flora: "Rubber, Coconut, Spices", temp: "22-32°C", description: "Tropical rainforest honey with medicinal properties, prized in Ayurveda.", image: "/images/multiflora-honey.png", featured: false },
            { id: 5, name: "Rajasthan", coords: { top: "35%", left: "35%" }, types: ["Mustard Honey", "Ber Honey"], altitude: "200-600m", flora: "Mustard, Ber, Babool", temp: "15-42°C", description: "Unique desert-flora honey with bold flavor profiles from wild Ber and Mustard fields.", image: "/images/pollen-honey.png", featured: false },
        ];
    }, [siteSettings.honey_map_json]);

    useEffect(() => {
        if (sourceLocations.length > 0 && !selected) {
            setSelected(sourceLocations[0]);
        }
    }, [sourceLocations, selected]);

    const handleSelect = (loc: any) => {
        setSelected(loc);

        // Fly-to effect
        if (mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            const x = (parseFloat(loc.coords.left) - 50) * 1.5;
            const y = (parseFloat(loc.coords.top) - 50) * 1.5;

            gsap.to(".map-canvas", {
                x: -x + "%",
                y: -y + "%",
                scale: 1.2,
                duration: 1.2,
                ease: "power3.inOut"
            });
        }
    };

    if (!selected) return null;

    return (
        <div className="bg-[#FAFAFA] min-h-screen">
            <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
                <div className="absolute inset-0 honeycomb-pattern opacity-10" />
                <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Traceability</motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl tracking-tight">Honey Source Map</motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">Know exactly where your honey comes from.</motion.p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Map */}
                    <div ref={mapRef} className="relative bg-[#E8F5E9] rounded-3xl p-8 border border-[#CDDBCE]/30 min-h-[500px] overflow-hidden">
                        <div className="map-canvas w-full h-full relative transition-transform">
                            {/* India outline simplified */}
                            <svg viewBox="0 0 100 120" className="w-full h-auto opacity-20">
                                <path d="M45,5 C30,8 20,15 15,25 C10,35 12,50 15,60 C18,70 25,80 35,90 C40,95 45,100 50,110 C52,105 55,95 60,88 C70,75 80,65 85,50 C88,40 85,30 80,22 C75,15 65,8 55,5 Z" fill="#1B5E20" />
                            </svg>

                            {/* Location pins */}
                            {sourceLocations.map((loc: any) => (
                                <button key={loc.id}
                                    onClick={() => handleSelect(loc)}
                                    className={`absolute z-10 group cursor-pointer transition-all duration-300 ${selected.id === loc.id ? "scale-125" : "hover:scale-110"}`}
                                    style={{ top: loc.coords.top, left: loc.coords.left }}
                                >
                                    <div className={`relative ${selected.id === loc.id ? "" : ""}`}>
                                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shadow-lg transition-colors ${selected.id === loc.id ? "bg-[#F5A623]" : "bg-[#3A8E3C]"}`}>
                                            <MapPin className="h-3 w-3 text-white" />
                                        </div>
                                        {selected.id === loc.id && <div className="absolute inset-0 rounded-full bg-[#F5A623] animate-ping opacity-30" />}
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-[#1B5E20] whitespace-nowrap font-inter">{loc.name.split(",")[0]}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected location info */}
                    <motion.div key={selected.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-lg border-4 border-white">
                            <img loading="lazy" decoding="async" src={selected.image} alt={selected.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                            {selected.featured && <span className="text-[10px] font-bold text-[#F5A623] bg-[#FFF8E7] px-3 py-1 rounded-full uppercase tracking-wider font-inter mb-3 inline-block">Primary Source</span>}
                            <h2 className="font-serif text-3xl font-bold text-[#1B5E20]">{selected.name}</h2>
                            <p className="text-sm text-[#4A7C4D] mt-3 leading-relaxed font-inter">{selected.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: <Mountain className="h-4 w-4" />, label: "Altitude", value: selected.altitude },
                                { icon: <Leaf className="h-4 w-4" />, label: "Flora", value: selected.flora },
                                { icon: <Thermometer className="h-4 w-4" />, label: "Temperature", value: selected.temp },
                            ].map((item: any, i: number) => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-[#CDDBCE]/30 text-center">
                                    <div className="h-8 w-8 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#3A8E3C] mx-auto mb-2">{item.icon}</div>
                                    <p className="text-[10px] text-[#6B9E6E] font-semibold uppercase tracking-wider font-inter mb-0.5">{item.label}</p>
                                    <p className="text-xs font-bold text-[#1B5E20] font-inter">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-2 font-inter">Honey Types</h4>
                            <div className="flex flex-wrap gap-2">
                                {selected.types.map((type: string) => (
                                    <span key={type} className="text-xs bg-[#E8F5E9] text-[#1B5E20] px-3 py-1.5 rounded-full font-medium font-inter">{type}</span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
