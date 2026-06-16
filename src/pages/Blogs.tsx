import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBlogs, Blog } from "@/lib/api";
import { ArrowUpRight, User, Clock, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    getBlogs().then(setBlogs);
  }, []);

  const categories = ["All", ...Array.from(new Set(blogs.map(b => b.category)))];
  const filtered = activeCategory === "All" ? blogs : blogs.filter(b => b.category === activeCategory);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const readingTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="bg-[#0D3B0E] py-28 sm:py-36 relative overflow-hidden noise-overlay">
        <div className="absolute inset-0 honeycomb-pattern opacity-10" />
        <div className="absolute top-0 left-0 -ml-20 -mt-20 h-[500px] w-[500px] rounded-full bg-[#3A8E3C]/8 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center z-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-semibold text-[#F5A623] uppercase tracking-[0.2em] mb-4 font-inter">Stories & Insights</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl font-bold text-white sm:text-6xl tracking-tight">The Journal</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 text-sm text-white/70 max-w-md mx-auto font-inter">
            Stories about honey, health, sustainability, and the beautiful world of bees.
          </motion.p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-12 overflow-x-auto pb-2">
          <SlidersHorizontal className="h-4 w-4 text-[#6B9E6E] mr-2 flex-shrink-0" />
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap uppercase tracking-wider font-inter ${activeCategory === cat
                ? "bg-[#1B5E20] text-white shadow-lg shadow-[#1B5E20]/15"
                : "bg-white text-[#6B9E6E] hover:bg-[#E8F5E9] hover:text-[#1B5E20] border border-[#CDDBCE]/40"
                }`}>
              {cat}
            </button>
          ))}
        </motion.div>

        {featured && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
            <Link to={`/blog/${featured.id}`} className="group block">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl overflow-hidden border border-[#CDDBCE]/40 card-lift">
                <div className="aspect-[16/10] lg:aspect-auto overflow-hidden relative">
                  <img loading="lazy" decoding="async" src={featured.image} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#1B5E20] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-inter">Featured</span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <p className="text-[10px] text-[#F5A623] font-semibold uppercase tracking-[0.2em] mb-3 font-inter">{featured.category}</p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-4 group-hover:text-[#3A8E3C] transition-colors leading-tight">{featured.title}</h2>
                  <p className="text-sm text-[#6B9E6E] leading-relaxed mb-6 line-clamp-3 font-inter">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-[#6B9E6E] font-inter">
                    <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {featured.author}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {readingTime(featured.content)} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {rest.map((blog, idx) => (
              <motion.div key={blog.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.04 }}>
                <Link to={`/blog/${blog.id}`} className="group block">
                  <div className="bg-white rounded-3xl overflow-hidden border border-[#CDDBCE]/40 card-lift cursor-pointer">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img loading="lazy" decoding="async" src={blog.image} alt={blog.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-[10px] text-[#1B5E20] font-semibold px-3 py-1 rounded-full uppercase tracking-wider font-inter">{blog.category}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-base font-bold text-[#1B5E20] mb-2 group-hover:text-[#3A8E3C] transition-colors leading-snug">{blog.title}</h3>
                      <p className="text-xs text-[#6B9E6E] line-clamp-2 mb-4 font-inter">{blog.excerpt}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#6B9E6E] pt-4 border-t border-[#CDDBCE]/30 font-inter">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {blog.author}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {readingTime(blog.content)} min</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
