import React, { useState, useEffect, useMemo } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { createInquiry, getPublicSettings } from "@/lib/api";

export default function Contact() {
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPublicSettings().then(setSiteSettings);
  }, []);

  const contactInfo = useMemo(() => {
    try {
      if (siteSettings.contact_info_json) return JSON.parse(siteSettings.contact_info_json);
    } catch (e) { console.error("Invalid contact_info_json", e); }
    return {
      address: "Geeta Hospital Road, Sajjapuram,\nTanuku, West Godavari,\nAndhra Pradesh - 534211",
      whatsapp: "917070324141",
      whatsapp_display: "+91 70703 24141",
      social: [
        { icon: "lni lni-instagram", url: "#" },
        { icon: "lni lni-facebook", url: "#" },
        { icon: "lni lni-twitter", url: "#" }
      ]
    };
  }, [siteSettings.contact_info_json]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createInquiry(formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (error) {
      alert("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* Header */}
      <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-[#3A8E3C]/8 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Reach Out</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl tracking-tight">Get in Touch</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">
            Have something to share? We’d love to hear from you.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-24">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-1 rounded-3xl bg-white p-8 shadow-lg border border-[#CDDBCE]/30">
            <h3 className="text-[10px] font-semibold text-[#6B9E6E] uppercase tracking-[0.2em] mb-6 font-inter">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#3A8E3C]">
                  <i className="lni lni-map-marker text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1B5E20] text-xs">Visit Us</h4>
                  <p className="mt-1 text-xs text-[#6B9E6E] leading-relaxed whitespace-pre-line font-inter">{contactInfo.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#3A8E3C]">
                  <i className="lni lni-whatsapp text-sm"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-[#1B5E20] text-xs">Chat with Us</h4>
                  <p className="mt-1 text-xs text-[#6B9E6E] leading-relaxed whitespace-pre-line font-inter">{contactInfo.whatsapp_display}{"\n"}Available 24/7</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#CDDBCE]/30">
              <h4 className="text-[10px] font-semibold text-[#6B9E6E] uppercase tracking-[0.2em] mb-3 font-inter">Follow Us</h4>
              <div className="flex gap-2">
                {contactInfo.social.map((s: any, idx: number) => (
                  <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-[#3A8E3C] hover:bg-[#1B5E20] hover:text-white transition-all duration-300 cursor-pointer">
                    <i className={`${s.icon} text-xs`}></i>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-3xl bg-white p-8 sm:p-12 shadow-lg border border-[#CDDBCE]/30 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute -top-20 -right-20 h-40 w-40 bg-[#3A8E3C]/5 rounded-full blur-3xl" />
            
            <div className="h-20 w-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-8">
              <img loading="lazy" decoding="async" src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-10 w-10" />
            </div>

            <h2 className="mb-4 text-3xl font-bold text-[#1B5E20] font-serif relative z-10">Chat Directly with प्रकृति</h2>
            <p className="text-sm text-[#6B9E6E] mb-10 relative z-10 font-inter max-w-md">
              We've moved our support entirely to WhatsApp for better family care. Click below to start a conversation with us instantly!
            </p>

            <a 
              href={`https://wa.me/${contactInfo.whatsapp}?text=Hi%20LiveGreen%20Team!%20I%20have%20something%20to%20share.`}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-12 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl text-sm uppercase tracking-widest"
            >
              Send WhatsApp Message
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
