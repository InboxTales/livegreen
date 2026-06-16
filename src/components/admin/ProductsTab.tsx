import React, { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct, uploadImage, Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash, X, Save, Search } from "lucide-react";
import { motion } from "motion/react";

export function ProductsTab() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const p = await getProducts();
        setProducts(p);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(id);
            loadData();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productData = {
                ...currentItem,
                price: parseInt(currentItem.price || "0") || 0,
                originalPrice: currentItem.originalPrice ? parseInt(currentItem.originalPrice) : null,
                stock: parseInt(currentItem.stock || "100") || 0,
                allow_subscription: currentItem.allow_subscription || false,
                subscription_discount: parseInt(currentItem.subscription_discount || "0") || 0,
                features: Array.isArray(currentItem.features) ? currentItem.features : [],
                about_items: Array.isArray(currentItem.about_items) ? currentItem.about_items : [],
                purity_profile: currentItem.purity_profile || {},
                product_info: currentItem.product_info || {},
                rating_override: currentItem.rating_override ? parseFloat(currentItem.rating_override) : null,
                weight_grams: parseInt(currentItem.weight_grams || "500") || 500,
                length_cm: parseInt(currentItem.length_cm || "15") || 15,
                breadth_cm: parseInt(currentItem.breadth_cm || "15") || 15,
                height_cm: parseInt(currentItem.height_cm || "10") || 10,
            };

            if (currentItem.id) {
                await updateProduct(currentItem.id, productData);
            } else {
                await createProduct(productData);
            }
            setIsEditing(false);
            setCurrentItem(null);
            loadData();
        } catch (error) {
            console.error("Failed to save product:", error);
            alert("Failed to save product. Please try again.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const res = await uploadImage(file);
            if (res.success) {
                setCurrentItem({ ...currentItem, image: res.url });
            }
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const filteredItems = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Products</h2>
                    <p className="text-gray-500 mt-1">Manage your honey inventory and metadata.</p>
                </div>
                <Button
                    onClick={() => { 
                      setIsEditing(true); 
                      setCurrentItem({ 
                        stock: 100, 
                        features: [], 
                        about_items: [],
                        purity_profile: {
                          glucose_fructose_ratio: "",
                          moisture_content: "",
                          pollen_count: "",
                          sucrose_content: "",
                          hmf_level: ""
                        },
                        product_info: {
                          brand: "Live Green",
                          net_weight: "",
                          package_type: "Glass Jar",
                          source: "",
                          extraction: "Cold-Extracted (Raw)",
                          shelf_life: "24 months",
                          storage: "Cool, dry place away from sunlight",
                          certifications: "FSSAI Certified",
                          country_of_origin: "India 🇮🇳"
                        }
                      }); 
                    }}
                    className="bg-[#1B5E20] hover:bg-[#144a18] text-white rounded-xl px-6 h-12 shadow-lg shadow-green-900/20"
                >
                    <Plus className="mr-2 h-5 w-5" /> Add New Product
                </Button>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search products..."
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
                            {currentItem?.id ? "Edit Product" : "Create Product"}
                        </h3>
                        <button type="button" onClick={() => setIsEditing(false)} className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Name</label>
                                <Input value={currentItem?.name || ""} onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })} required className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Category</label>
                                <Input value={currentItem?.category || ""} onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })} required className="h-12 rounded-xl" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Price (₹)</label>
                                <Input type="number" value={currentItem?.price || ""} onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })} required className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Original Price (₹)</label>
                                <Input type="number" value={currentItem?.originalPrice || ""} onChange={(e) => setCurrentItem({ ...currentItem, originalPrice: e.target.value })} className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Stock Available</label>
                                <Input type="number" value={currentItem?.stock || ""} onChange={(e) => setCurrentItem({ ...currentItem, stock: e.target.value })} required className="h-12 rounded-xl" />
                            </div>
                        </div>

                        {/* Shipping details used by iCarry booking */}
                        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
                            <p className="text-sm font-bold text-gray-700 mb-1">Shipping (per unit) — used for iCarry / Xpressbees booking</p>
                            <p className="text-xs text-gray-400 mb-4">Weight is multiplied by quantity; the largest box dimensions across items are used.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Weight (g)</label>
                                    <Input type="number" value={currentItem?.weight_grams ?? ""} onChange={(e) => setCurrentItem({ ...currentItem, weight_grams: e.target.value })} placeholder="500" className="h-11 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Length (cm)</label>
                                    <Input type="number" value={currentItem?.length_cm ?? ""} onChange={(e) => setCurrentItem({ ...currentItem, length_cm: e.target.value })} placeholder="15" className="h-11 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Breadth (cm)</label>
                                    <Input type="number" value={currentItem?.breadth_cm ?? ""} onChange={(e) => setCurrentItem({ ...currentItem, breadth_cm: e.target.value })} placeholder="15" className="h-11 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Height (cm)</label>
                                    <Input type="number" value={currentItem?.height_cm ?? ""} onChange={(e) => setCurrentItem({ ...currentItem, height_cm: e.target.value })} placeholder="10" className="h-11 rounded-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">SEO Title</label>
                                <Input value={currentItem?.seoTitle || ""} onChange={(e) => setCurrentItem({ ...currentItem, seoTitle: e.target.value })} className="h-12 rounded-xl" placeholder="Leave blank to use Name" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Ribbons (Badge labels)</label>
                                <Input value={currentItem?.ribbon || ""} onChange={(e) => setCurrentItem({ ...currentItem, ribbon: e.target.value })} className="h-12 rounded-xl" placeholder="e.g. Bestseller, Limited Edition" />
                                <p className="text-xs text-gray-500 mt-1">Separate multiple ribbons with commas.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-green-50/50 p-6 rounded-2xl border border-green-100">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="allow_subscription"
                                    checked={currentItem?.allow_subscription || false}
                                    onChange={(e) => setCurrentItem({ ...currentItem, allow_subscription: e.target.checked })}
                                    className="h-5 w-5 rounded border-gray-300 text-[#1B5E20] focus:ring-[#1B5E20]"
                                />
                                <label htmlFor="allow_subscription" className="text-sm font-bold text-gray-700 cursor-pointer">Enable Subscription (Subscribe & Save)</label>
                            </div>
                            {currentItem?.allow_subscription && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-700">Subscription Discount (%)</label>
                                    <Input
                                        type="number"
                                        value={currentItem?.subscription_discount || ""}
                                        onChange={(e) => setCurrentItem({ ...currentItem, subscription_discount: e.target.value })}
                                        placeholder="e.g. 10"
                                        className="h-12 rounded-xl bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Description</label>
                            <textarea className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:border-[#1B5E20] focus:outline-none focus:ring-1 focus:ring-[#1B5E20] min-h-[120px]" rows={4} value={currentItem?.description || ""} onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })} required />
                        </div>

                        {/* Extended Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Subtitle/Type</label>
                                <Input value={currentItem?.subtitle || ""} onChange={(e) => setCurrentItem({ ...currentItem, subtitle: e.target.value })} placeholder="e.g. Multiflora" className="h-12 rounded-xl bg-white" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Rating Override</label>
                                <Input type="number" step="0.1" value={currentItem?.rating_override || ""} onChange={(e) => setCurrentItem({ ...currentItem, rating_override: e.target.value })} placeholder="e.g. 4.7" className="h-12 rounded-xl bg-white" />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700">Bought Count Status</label>
                                <Input value={currentItem?.bought_count || ""} onChange={(e) => setCurrentItem({ ...currentItem, bought_count: e.target.value })} placeholder="e.g. 500+ bought last month" className="h-12 rounded-xl bg-white" />
                            </div>
                        </div>

                        {/* About Items List */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">About This Item (Bullet Points)</label>
                            <div className="space-y-2">
                                {(currentItem?.about_items || []).map((item: string, idx: number) => (
                                    <div key={idx} className="flex gap-2">
                                        <Input 
                                          value={item} 
                                          onChange={(e) => {
                                            const newItems = [...(currentItem.about_items || [])];
                                            newItems[idx] = e.target.value;
                                            setCurrentItem({ ...currentItem, about_items: newItems });
                                          }}
                                          className="h-10 rounded-lg"
                                        />
                                        <Button type="button" variant="ghost" onClick={() => {
                                          const newItems = (currentItem.about_items || []).filter((_: any, i: number) => i !== idx);
                                          setCurrentItem({ ...currentItem, about_items: newItems });
                                        }} className="text-red-500 hover:text-red-700">
                                          <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                  setCurrentItem({ ...currentItem, about_items: [...(currentItem.about_items || []), ""] });
                                }} className="rounded-lg">
                                  <Plus className="h-4 w-4 mr-2" /> Add Bullet Point
                                </Button>
                            </div>
                        </div>

                        {/* Purity Profile */}
                        <div className="space-y-6">
                            <h4 className="text-md font-bold text-gray-800 border-b pb-2">Purity Profile</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { key: 'glucose_fructose_ratio', label: 'Glucose/Fructose Ratio', placeholder: '1.2:1' },
                                    { key: 'moisture_content', label: 'Moisture Content', placeholder: '17.4%' },
                                    { key: 'pollen_count', label: 'Pollen Count', placeholder: 'High (Wild)' },
                                    { key: 'sucrose_content', label: 'Sucrose Content', placeholder: '0.2%' },
                                    { key: 'hmf_level', label: 'HMF Level', placeholder: '<10 mg/kg' },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">{field.label}</label>
                                        <Input 
                                          value={currentItem?.purity_profile?.[field.key] || ""} 
                                          onChange={(e) => setCurrentItem({ 
                                            ...currentItem, 
                                            purity_profile: { ...currentItem.purity_profile, [field.key]: e.target.value } 
                                          })} 
                                          placeholder={field.placeholder}
                                          className="h-10 rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product Information */}
                        <div className="space-y-6">
                            <h4 className="text-md font-bold text-gray-800 border-b pb-2">Product Information (Specifications)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { key: 'brand', label: 'Brand' },
                                    { key: 'net_weight', label: 'Net Weight' },
                                    { key: 'package_type', label: 'Package Type' },
                                    { key: 'source', label: 'Source' },
                                    { key: 'extraction', label: 'Extraction' },
                                    { key: 'shelf_life', label: 'Shelf Life' },
                                    { key: 'storage', label: 'Storage' },
                                    { key: 'certifications', label: 'Certifications' },
                                    { key: 'country_of_origin', label: 'Country of Origin' },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">{field.label}</label>
                                        <Input 
                                          value={currentItem?.product_info?.[field.key] || ""} 
                                          onChange={(e) => setCurrentItem({ 
                                            ...currentItem, 
                                            product_info: { ...currentItem.product_info, [field.key]: e.target.value } 
                                          })}
                                          className="h-10 rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Product Image</label>
                            <div className="flex items-center gap-6">
                                {currentItem?.image && (
                                    <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden border border-gray-200">
                                        <img loading="lazy" decoding="async" src={currentItem.image} alt="Product" className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2">
                                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-[#1B5E20] transition-colors">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleImageUpload}
                                            disabled={isUploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                        />
                                        <div className="text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {isUploading ? "Uploading..." : "Click or drag image to upload"}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
                                        </div>
                                    </div>
                                    {isUploading && (
                                        <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#1B5E20] w-1/2 animate-pulse rounded-full" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="h-12 px-8 rounded-xl border-gray-200">Cancel</Button>
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
                                <img loading="lazy" decoding="async" src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    <button onClick={(e) => { e.stopPropagation(); setCurrentItem(item); setIsEditing(true); }} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:text-[#1B5E20] transition-all"><Edit className="h-4 w-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"><Trash className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-[#1B5E20] uppercase">{item.category}</span>
                                        {item.ribbon && item.ribbon.split(',').map((r: string, rIdx: number) => (
                                            <span key={rIdx} className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800 uppercase">
                                                {r.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 font-serif text-lg line-clamp-1 mb-1">{item.name}</h3>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">Stock: {item.stock}</p>
                                    {item.allow_subscription && (
                                        <span className="text-[10px] font-black text-[#1B5E20] uppercase bg-green-100 px-2 py-0.5 rounded">Sub Ready ({item.subscription_discount}%)</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
