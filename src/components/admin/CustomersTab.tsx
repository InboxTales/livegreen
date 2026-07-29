import React, { useState, useEffect } from "react";
import { getCustomers, Customer } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "motion/react";

export function CustomersTab() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        const data = await getCustomers();
        setCustomers(data);
    };

    const filteredCustomers = customers.filter(c => {
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const phone = (c.phone || '');
        const term = searchTerm.toLowerCase();
        return name.includes(term) || email.includes(term) || phone.includes(searchTerm);
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 font-serif">Customers</h2>
                    <p className="text-gray-500 mt-1">View your customer base and lifetime value.</p>
                </div>
            </div>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder="Search by Name, Email, or Phone..."
                    className="pl-12 h-12 rounded-xl bg-white border-gray-200 shadow-sm focus:ring-[#1B5E20] focus:border-[#1B5E20]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-500">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Contact Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-500">Join Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-center">Total Orders</th>
                                <th className="px-6 py-4 font-semibold text-gray-500 text-right">Lifetime Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No customers found matching your search.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase">
                                                    {(customer.name || '?').charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900">{customer.name || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{customer.email || '—'}</div>
                                            <div className="text-gray-500 text-xs">{customer.phone || '—'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(customer.joinDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                                                {customer.ordersCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-[#1B5E20]">₹{customer.totalSpent.toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
