import React, { useState, useEffect } from "react";
import { getBlogs, createBlog, updateBlog, deleteBlog, Blog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, X, Save, Search } from "lucide-react";
import { motion } from "motion/react";

export function BlogsTab() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const b = await getBlogs();
        setBlogs(b);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this post?")) {
            await deleteBlog(id);
            loadData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const blogData = {
            ...currentItem,
            date: currentItem.date || new Date().toISOString(),
        };
        if (currentItem.id) {
            await updateBlog(currentItem.id, blogData);
        } else {
            await createBlog(blogData);
        }
        setIsEditing(false);
        setCurrentItem(null);
        loadData();
    };

    const filteredItems = blogs.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Blogs</h2>
                    <p className="text-gray-500 mt-1">Manage your blog content and SEO metadata.</p>
                </div>
                <Button
                    onClick={() => { setIsEditing(true); setCurrentItem({}); }}
                    className="bg-[#1B5E20] hover:bg-[#144a18] text-white rounded-xl px-6 h-12 shadow-lg shadow-green-900/20"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add New Post
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search blogs..."
                    className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isEditing ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl bg-white p-8 shadow-lg border border-gray-100"
                >
                    <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-6">
                        <h3 className="text-xl font-bold text-[#1B5E20] font-serif">
                            {currentItem?.id ? "Edit Post" : "Create Post"}
                        </h3>
                        <button type="button" onClick={() => setIsEditing(false)} className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Title</label>
                            <Input
                                value={currentItem?.title || ""}
                                onChange={(e) => setCurrentItem({ ...currentItem, title: e.target.value })}
                                required
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Author</label>
                                <Input
                                    value={currentItem?.author || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, author: e.target.value })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Category</label>
                                <Input
                                    value={currentItem?.category || ""}
                                    onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                                    required
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">SEO Title</label>
                            <Input value={currentItem?.seoTitle || ""} onChange={(e) => setCurrentItem({ ...currentItem, seoTitle: e.target.value })} className="h-12 rounded-xl" placeholder="Leave blank to use Title" />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Excerpt</label>
                            <textarea
                                className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:border-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#1B5E20]"
                                rows={3}
                                value={currentItem?.excerpt || ""}
                                onChange={(e) => setCurrentItem({ ...currentItem, excerpt: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Content</label>
                            <textarea
                                className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:border-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#1B5E20] font-mono"
                                rows={12}
                                value={currentItem?.content || ""}
                                onChange={(e) => setCurrentItem({ ...currentItem, content: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Image URL</label>
                            <Input
                                value={currentItem?.image || ""}
                                onChange={(e) => setCurrentItem({ ...currentItem, image: e.target.value })}
                                className="h-12 rounded-xl flex-1"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-8 rounded-xl border-gray-200">
                                Cancel
                            </Button>
                            <Button type="submit" className="h-12 px-8 rounded-xl bg-[#1B5E20] hover:bg-[#144a18]">
                                <Save className="mr-2 h-4 w-4" /> Save
                            </Button>
                        </div>
                    </form>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredItems.map(item => (
                        <motion.div key={item.id} className="group relative overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                            <div className="relative h-56 overflow-hidden">
                                <img loading="lazy" decoding="async" src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <button onClick={(e) => { e.stopPropagation(); setCurrentItem(item); setIsEditing(true); }} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-[#1B5E20] transition-all"><Edit className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"><Trash className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-[#1B5E20] uppercase tracking-wider">{item.category}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 font-serif text-lg line-clamp-1 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.excerpt}</p>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                    <span>{item.author}</span>
                                    <span>{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
