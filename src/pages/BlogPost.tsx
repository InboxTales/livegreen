import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBlog, getBlogs, Blog } from "@/lib/api";
import { ArrowLeft, Calendar, User, Clock, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import SEO from "@/components/SEO";

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      getBlog(parseInt(id)).then(setBlog);
      getBlogs().then((blogs) => {
        setRelatedBlogs(blogs.filter(b => b.id !== parseInt(id)).slice(0, 3));
      });
    }
  }, [id]);

  const readingTime = (content: string) => Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3A8E3C]" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={blog.seoTitle || `${blog.title} | Live Green Honey`}
        description={blog.seoDescription || blog.excerpt}
        keywords={blog.seoKeywords}
      />
      <div className="bg-[#FAFAFA] min-h-screen">
        {/* Hero */}
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img loading="lazy" decoding="async" src={blog.image} alt={blog.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D3B0E]/90 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-3xl">
              <Link to="/blogs" className="inline-flex items-center gap-2 text-sm text-green-200/80 hover:text-white transition-colors mb-6 font-inter">
                <ArrowLeft className="h-4 w-4" /> Back to Journal
              </Link>
              <span className="inline-block text-[#F5A623] font-bold tracking-wider uppercase text-xs bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full mb-4 border border-white/10 font-inter">
                {blog.category}
              </span>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
                {blog.title}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-green-100/70 font-inter">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {blog.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(blog.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {readingTime(blog.content)} min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#CDDBCE]/30">
            <div className="prose prose-lg max-w-none text-[#4A7C4D] leading-relaxed font-inter">
              {blog.content.split("\n").map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>

            {/* Share */}
            <div className="mt-10 pt-8 border-t border-[#CDDBCE]/20 flex items-center justify-between">
              <p className="text-[10px] font-bold text-[#6B9E6E] uppercase tracking-[0.2em] font-inter">Share this article</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyLink}
                  className="rounded-full border-[#CDDBCE] text-[#6B9E6E] hover:bg-[#E8F5E9] hover:text-[#1B5E20] hover:border-[#3A8E3C] transition-all cursor-pointer font-inter text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1 text-[#3A8E3C]" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
                <a href={`https://wa.me/?text=${encodeURIComponent(blog.title + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline"
                    className="rounded-full border-[#CDDBCE] text-[#6B9E6E] hover:bg-[#E8F5E9] hover:text-[#1B5E20] hover:border-[#3A8E3C] transition-all cursor-pointer font-inter text-xs">
                    <Share2 className="h-3.5 w-3.5 mr-1" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </motion.article>

          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <div className="mt-16">
              <h2 className="font-serif text-2xl font-bold text-[#1B5E20] mb-8">More Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedBlogs.map((rb) => (
                  <Link key={rb.id} to={`/blog/${rb.id}`} className="group block">
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#CDDBCE]/30 card-lift cursor-pointer">
                      <div className="aspect-[16/10] overflow-hidden">
                        <img loading="lazy" decoding="async" src={rb.image} alt={rb.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-sm font-bold text-[#1B5E20] group-hover:text-[#3A8E3C] transition-colors line-clamp-2">{rb.title}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
