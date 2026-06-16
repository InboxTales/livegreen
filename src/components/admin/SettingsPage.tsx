import React, { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function SettingsPage() {
    const { token } = useAuth();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const settingsMap: Record<string, string> = {};
                data.forEach((item: any) => {
                    settingsMap[item.key_name] = item.key_value;
                });
                setSettings(settingsMap);
            }
        } catch (e) {
            console.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key_name: string, key_value: string) => {
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ key_name, key_value })
            });

            if (res.ok) {
                setStatus({ type: 'success', message: 'Settings saved successfully!' });
                setTimeout(() => setStatus(null), 3000);
            } else {
                throw new Error("Failed to save");
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-[#1B5E20]">Platform Settings</h2>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-[#E8F5E9] text-[#1B5E20]' : 'bg-rose-50 text-rose-600'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">{status.message}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-8">

                {/* Razorpay Settings */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">Razorpay Gateway</h3>
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings['razorpay_key'] || ''}
                                    onChange={(e) => handleChange('razorpay_key', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('razorpay_key', settings['razorpay_key'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Secret Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={settings['razorpay_secret'] || ''}
                                    onChange={(e) => handleChange('razorpay_secret', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('razorpay_secret', settings['razorpay_secret'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* iCarry Settings */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">🚚 Logistics (iCarry.in)</h3>
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Username</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings['icarry_username'] || ''}
                                    onChange={(e) => handleChange('icarry_username', e.target.value)}
                                    placeholder="e.g. ela39261"
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('icarry_username', settings['icarry_username'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={settings['icarry_key'] || ''}
                                    onChange={(e) => handleChange('icarry_key', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('icarry_key', settings['icarry_key'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address ID (Warehouse Code)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings['icarry_pickup_address_id'] || ''}
                                    onChange={(e) => handleChange('icarry_pickup_address_id', e.target.value)}
                                    placeholder="Enter your warehouse identifier from iCarry"
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('icarry_pickup_address_id', settings['icarry_pickup_address_id'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Origin Pincode (Pickup PIN)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings['icarry_origin_pincode'] || ''}
                                    onChange={(e) => handleChange('icarry_origin_pincode', e.target.value)}
                                    placeholder="e.g. 400071"
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('icarry_origin_pincode', settings['icarry_origin_pincode'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Courier (e.g. Xpressbees)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings['icarry_preferred_courier'] || ''}
                                    onChange={(e) => handleChange('icarry_preferred_courier', e.target.value)}
                                    placeholder="xpressbees"
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('icarry_preferred_courier', settings['icarry_preferred_courier'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Bookings pick this courier from iCarry's rates. Leave as "xpressbees" to ship via Xpressbees. Blank = iCarry auto-assigns.</p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-xs text-blue-700">
                                <p className="font-bold mb-1">Configuration Note:</p>
                                <p>Ensure your server's IP is whitelisted in the iCarry.in dashboard. Automated booking will only trigger if the Pickup Address ID is correctly set.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Page Content */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">🏠 Home Page Content</h3>
                    <div className="space-y-6 max-w-2xl">
                        {/* Hero Section */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Hero Section</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hero Title</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_hero_title'] || ''} onChange={(e) => handleChange('home_hero_title', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_hero_title', settings['home_hero_title'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hero Subtitle</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_hero_subtitle'] || ''} onChange={(e) => handleChange('home_hero_subtitle', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_hero_subtitle', settings['home_hero_subtitle'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hero Description</label>
                                    <div className="flex gap-2">
                                        <textarea value={settings['home_hero_desc'] || ''} onChange={(e) => handleChange('home_hero_desc', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
                                        <button onClick={() => handleSave('home_hero_desc', settings['home_hero_desc'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hero Image URL</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_hero_image'] || ''} onChange={(e) => handleChange('home_hero_image', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_hero_image', settings['home_hero_image'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Our Promise Section */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Our Promise Section</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Promise Title</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_promise_title'] || ''} onChange={(e) => handleChange('home_promise_title', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_promise_title', settings['home_promise_title'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Promise Subtitle</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_promise_subtitle'] || ''} onChange={(e) => handleChange('home_promise_subtitle', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_promise_subtitle', settings['home_promise_subtitle'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Promise Description</label>
                                    <div className="flex gap-2">
                                        <textarea value={settings['home_promise_desc'] || ''} onChange={(e) => handleChange('home_promise_desc', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
                                        <button onClick={() => handleSave('home_promise_desc', settings['home_promise_desc'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Trust Statistics</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Google Rating (e.g. 4.9)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_trust_rating'] || ''} onChange={(e) => handleChange('home_trust_rating', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_trust_rating', settings['home_trust_rating'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Customer Count (e.g. 500+)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_trust_count'] || ''} onChange={(e) => handleChange('home_trust_count', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_trust_count', settings['home_trust_count'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roadmap JSON */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Production Roadmap (JSON)</h4>
                            <p className="text-xs text-gray-500">Edit the 6-step roadmap content here as a JSON array of objects with 'name' and 'desc'.</p>
                            <div className="flex gap-2">
                                <textarea 
                                    value={settings['home_roadmap_json'] || ''} 
                                    onChange={(e) => handleChange('home_roadmap_json', e.target.value)}
                                    placeholder='[{"name": "Sourcing", "desc": "..."}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" 
                                />
                                <button onClick={() => handleSave('home_roadmap_json', settings['home_roadmap_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1">
                                    <Save className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Comparison JSON */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Comparison Table (JSON)</h4>
                            <p className="text-xs text-gray-500">Edit features comparison as local JSON.</p>
                            <div className="flex gap-2">
                                <textarea 
                                    value={settings['home_comparison_json'] || ''} 
                                    onChange={(e) => handleChange('home_comparison_json', e.target.value)}
                                    placeholder='[{"feature": "...", "livegreen": "...", "commercial": "..."}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" 
                                />
                                <button onClick={() => handleSave('home_comparison_json', settings['home_comparison_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1">
                                    <Save className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Home Promise 2 */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Secondary Promise Section (Bottom)</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-widest">Title</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={settings['home_promise_2_title'] || ''} onChange={(e) => handleChange('home_promise_2_title', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                        <button onClick={() => handleSave('home_promise_2_title', settings['home_promise_2_title'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-widest">Description</label>
                                    <div className="flex gap-2">
                                        <textarea value={settings['home_promise_2_desc'] || ''} onChange={(e) => handleChange('home_promise_2_desc', e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
                                        <button onClick={() => handleSave('home_promise_2_desc', settings['home_promise_2_desc'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Testimonials JSON */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-800">Text Testimonials (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea 
                                    value={settings['home_testimonials_json'] || ''} 
                                    onChange={(e) => handleChange('home_testimonials_json', e.target.value)}
                                    placeholder='[{"name": "...", "text": "...", ...}]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" 
                                />
                                <button onClick={() => handleSave('home_testimonials_json', settings['home_testimonials_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1">
                                    <Save className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Shop Page Content */}
                <section className="mt-8">
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">Shop Page Content</h3>
                    <div className="space-y-4 max-w-2xl">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Title</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings['shop_hero_title'] || ''} onChange={(e) => handleChange('shop_hero_title', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                    <button onClick={() => handleSave('shop_hero_title', settings['shop_hero_title'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Subtitle</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings['shop_hero_subtitle'] || ''} onChange={(e) => handleChange('shop_hero_subtitle', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                    <button onClick={() => handleSave('shop_hero_subtitle', settings['shop_hero_subtitle'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Description</label>
                                <div className="flex gap-2">
                                    <textarea value={settings['shop_hero_desc'] || ''} onChange={(e) => handleChange('shop_hero_desc', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
                                    <button onClick={() => handleSave('shop_hero_desc', settings['shop_hero_desc'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Page Content */}
                <section className="mt-8">
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">About Page Content</h3>
                    <div className="space-y-4 max-w-2xl">
                        {/* About Hero */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Hero Section</h4>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Title</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings['about_hero_title'] || ''} onChange={(e) => handleChange('about_hero_title', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                    <button onClick={() => handleSave('about_hero_title', settings['about_hero_title'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Subtitle</label>
                                <div className="flex gap-2">
                                    <input type="text" value={settings['about_hero_subtitle'] || ''} onChange={(e) => handleChange('about_hero_subtitle', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm" />
                                    <button onClick={() => handleSave('about_hero_subtitle', settings['about_hero_subtitle'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hero Description</label>
                                <div className="flex gap-2">
                                    <textarea value={settings['about_hero_desc'] || ''} onChange={(e) => handleChange('about_hero_desc', e.target.value)}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm h-20 resize-none" />
                                    <button onClick={() => handleSave('about_hero_desc', settings['about_hero_desc'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* About Stats JSON */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Stats (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['about_stats_json'] || ''} onChange={(e) => handleChange('about_stats_json', e.target.value)}
                                    placeholder='[{"value": 50, "suffix": "+", "label": "Families", "icon": "..."}]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-32 resize-none" />
                                <button onClick={() => handleSave('about_stats_json', settings['about_stats_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* About Philosophy JSON */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Philosophy (Story Blocks) (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['about_philosophy_json'] || ''} onChange={(e) => handleChange('about_philosophy_json', e.target.value)}
                                    placeholder='{"subtitle": "Our Philosophy", "title": "...", "content": ["...", "..."]}'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('about_philosophy_json', settings['about_philosophy_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* About Origin JSON */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Origin Story (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['about_origin_json'] || ''} onChange={(e) => handleChange('about_origin_json', e.target.value)}
                                    placeholder='{"title": "...", "paragraphs": ["...", "..."]}'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('about_origin_json', settings['about_origin_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* About Timeline JSON */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Timeline (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['about_timeline_json'] || ''} onChange={(e) => handleChange('about_timeline_json', e.target.value)}
                                    placeholder='[{"year": "2018", "title": "...", "desc": "..."}]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('about_timeline_json', settings['about_timeline_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        {/* About Team JSON */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Team (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['about_team_json'] || ''} onChange={(e) => handleChange('about_team_json', e.target.value)}
                                    placeholder='[{"name": "...", "role": "...", "img": "...", "desc": "..."}]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('about_team_json', settings['about_team_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Additional Pages Content */}
                <section className="mt-8 mb-12">
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">Other Pages Content</h3>
                    <div className="space-y-4 max-w-2xl">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">FAQ Content (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['faq_json'] || ''} onChange={(e) => handleChange('faq_json', e.target.value)}
                                    placeholder='[{"question": "...", "answer": "..."}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('faq_json', settings['faq_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Contact Info (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['contact_info_json'] || ''} onChange={(e) => handleChange('contact_info_json', e.target.value)}
                                    placeholder='{"address": "...", "whatsapp": "...", "social": [...] }'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('contact_info_json', settings['contact_info_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">How We Work Process (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['how_we_work_json'] || ''} onChange={(e) => handleChange('how_we_work_json', e.target.value)}
                                    placeholder='[{"title": "...", "desc": "...", "points": [...]}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('how_we_work_json', settings['how_we_work_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Health Recipes (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['recipes_json'] || ''} onChange={(e) => handleChange('recipes_json', e.target.value)}
                                    placeholder='[{"title": "...", "description": "...", "ingredients": [...], "steps": [...]}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('recipes_json', settings['recipes_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                            <h4 className="text-sm font-bold text-gray-800">Honey Source Map (JSON)</h4>
                            <div className="flex gap-2">
                                <textarea value={settings['honey_map_json'] || ''} onChange={(e) => handleChange('honey_map_json', e.target.value)}
                                    placeholder='[{"name": "...", "coords": {"top": "...", "left": "..."}, ...}, ...]'
                                    className="flex-1 p-2 border border-gray-200 rounded-lg text-xs font-mono h-40 resize-none" />
                                <button onClick={() => handleSave('honey_map_json', settings['honey_map_json'])} disabled={saving} className="p-2 text-[#3A8E3C] hover:bg-white rounded-lg self-start mt-1"><Save className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Settings */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">AI Integrations</h3>
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">HuggingFace API Key (for Live Green AI Recommender)</label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={settings['hf_api_key'] || ''}
                                    onChange={(e) => handleChange('hf_api_key', e.target.value)}
                                    className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3A8E3C]/20 focus:border-[#3A8E3C] outline-none"
                                />
                                <button onClick={() => handleSave('hf_api_key', settings['hf_api_key'])} disabled={saving} className="px-4 py-2 bg-[#F5FFF5] text-[#3A8E3C] border border-[#3A8E3C]/20 hover:bg-[#E8F5E9] rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                                    <Save className="h-4 w-4" /> Save
                                </button>
                            </div>
                        </div>

                        {/* AI Assistant Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors mt-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">🤖</span>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Show AI Assistant Section</p>
                                    <p className="text-xs text-gray-500">Toggle visibility of the "Talk to Prakruthi" assistant on the homepage</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const curVal = settings['show_ai_recommender'] ?? '1';
                                    const newVal = curVal !== '0' ? '0' : '1';
                                    handleChange('show_ai_recommender', newVal);
                                    handleSave('show_ai_recommender', newVal);
                                }}
                                disabled={saving}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${(settings['show_ai_recommender'] ?? '1') !== '0' ? 'bg-[#3A8E3C]' : 'bg-gray-300'}`}
                            >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${(settings['show_ai_recommender'] ?? '1') !== '0' ? 'left-[26px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Chatbot Features */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">💬 Chatbot Features</h3>
                    <p className="text-sm text-gray-500 mb-4">Control which specific capabilities the interactive AI chatbot offers to users.</p>
                    <div className="space-y-3 max-w-2xl">
                        {[
                            { key: 'chatbot_feature_products', label: 'Browse Products', desc: 'Allow users to browse and search the product catalogue via chat', icon: '🛍️' },
                            { key: 'chatbot_feature_tracking', label: 'Order Tracking', desc: 'Enable automated order tracking directly within the chat window', icon: '📦' },
                            { key: 'chatbot_feature_offers', label: 'Promotions & Offers', desc: 'Let users ask for currently active coupon codes and discounts', icon: '🏷️' },
                            { key: 'chatbot_feature_recipes', label: 'Recipes Guide', desc: 'Show interactive recipes using your products', icon: '🍯' },
                            { key: 'chatbot_feature_health', label: 'Health Tips', desc: 'Provide health and wellbeing advice connected to your honey', icon: '❤️' },
                            { key: 'chatbot_feature_subscriptions', label: 'Manage Subscriptions', desc: 'Allow users to manage auto-refill schedules from the chatbot', icon: '🔄' },
                        ].map(item => {
                            const isOn = settings[item.key] !== '0';
                            return (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newVal = isOn ? '0' : '1';
                                            handleChange(item.key, newVal);
                                            handleSave(item.key, newVal);
                                        }}
                                        disabled={saving}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-[#3A8E3C]' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${isOn ? 'left-[26px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Email Notifications */}
                <section>
                    <h3 className="text-lg font-bold text-[#1B5E20] mb-4 flex items-center border-b pb-2">📧 Email Notifications</h3>
                    <p className="text-sm text-gray-500 mb-4">Control which emails are sent automatically. Toggle off to disable any notification type.</p>
                    <div className="space-y-3 max-w-2xl">
                        {[
                            { key: 'email_order_confirmation', label: 'Order Confirmation', desc: 'Send confirmation email when an order is placed', icon: '📦' },
                            { key: 'email_order_status', label: 'Order Status Updates', desc: 'Notify customers when order status changes (processing, shipped, delivered)', icon: '🚚' },
                            { key: 'email_welcome', label: 'Welcome Email', desc: 'Send welcome email to first-time customers', icon: '🐝' },
                            { key: 'email_inquiry_confirmation', label: 'Inquiry Confirmation', desc: 'Send confirmation to customers who submit inquiries', icon: '📬' },
                            { key: 'email_inquiry_admin_notify', label: 'Inquiry Admin Alert', desc: 'Notify admin (info@livegreenfarms.in) when a new inquiry arrives', icon: '🔔' },
                            { key: 'email_referral', label: 'Referral Notifications', desc: 'Send invite to referred friends and thank-you to referrers', icon: '🎁' },
                        ].map(item => {
                            const isOn = settings[item.key] !== '0';
                            return (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{item.icon}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newVal = isOn ? '0' : '1';
                                            handleChange(item.key, newVal);
                                            handleSave(item.key, newVal);
                                        }}
                                        disabled={saving}
                                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-[#3A8E3C]' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${isOn ? 'left-[26px]' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

            </div>
        </div>
    );
}
