import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Plus, Minus, Trash2, ChevronRight, ChevronLeft, Package, User, Settings, Eye, FileText, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getProducts, createManualOrder, Product } from "@/lib/api";
import { generateInvoice } from "@/lib/generateInvoice";
import type { Order } from "@/lib/api";

// ─── Indian State list (mirrors iCarry state codes) ───────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "COD", "Cheque", "Other"];

// ─── Types ─────────────────────────────────────────────────────────────────
interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface OrderSettings {
  paymentMethod: string;
  customPayment: string;
  useCustomDate: boolean;
  customDate: string;
  bookICarry: boolean;
  discountType: "none" | "fixed" | "percentage";
  discountValue: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Step indicator ────────────────────────────────────────────────────────
const STEPS = [
  { label: "Customer", icon: User },
  { label: "Products", icon: Package },
  { label: "Settings", icon: Settings },
  { label: "Review", icon: Eye },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  done
                    ? "bg-[#1B5E20] text-white"
                    : active
                    ? "bg-[#1B5E20]/10 border-2 border-[#1B5E20] text-[#1B5E20]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  active ? "text-[#1B5E20]" : done ? "text-gray-500" : "text-gray-300"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mt-[-14px] transition-all duration-500 ${
                  i < current ? "bg-[#1B5E20]" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Customer Info ─────────────────────────────────────────────────
function StepCustomer({
  info,
  onChange,
}: {
  info: CustomerInfo;
  onChange: (k: keyof CustomerInfo, v: string) => void;
}) {
  const field = (
    label: string,
    key: keyof CustomerInfo,
    type = "text",
    required = true
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={info[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className="h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
        required={required}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">{field("Full Name", "name")}</div>
      {field("Email", "email", "email")}
      {field("Phone", "phone", "tel")}
      <div className="sm:col-span-2">{field("Address", "address")}</div>
      {field("City", "city")}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          State <span className="text-red-500">*</span>
        </label>
        <select
          value={info.state}
          onChange={(e) => onChange("state", e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-[#1B5E20] focus:border-[#1B5E20] text-sm"
        >
          <option value="">Select State</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {field("ZIP / Pincode", "zip")}
    </div>
  );
}

// ─── Step 2: Products ──────────────────────────────────────────────────────
function StepProducts({
  cart,
  onAdd,
  onUpdateQty,
  onRemove,
}: {
  cart: CartItem[];
  onAdd: (product: Product) => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onRemove: (productId: number) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const cartIds = new Set(cart.map((c) => c.product.id));

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
        />
      </div>

      {/* Product grid */}
      <div className="max-h-56 overflow-y-auto pr-1 space-y-2 rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading products…
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No products found.</p>
        ) : (
          filtered.map((p) => {
            const inCart = cartIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  inCart
                    ? "border-[#1B5E20]/30 bg-[#1B5E20]/5"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">₹{p.price} · Stock: {p.stock}</p>
                </div>
                <button
                  onClick={() => onAdd(p)}
                  disabled={inCart}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    inCart
                      ? "bg-[#1B5E20] text-white cursor-default"
                      : "bg-gray-100 text-gray-600 hover:bg-[#1B5E20] hover:text-white"
                  }`}
                >
                  {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Order Items ({cart.length})
          </h4>
          <div className="space-y-2">
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-xs truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">₹{product.price} × {quantity} = ₹{product.price * quantity}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQty(product.id, quantity - 1)}
                    className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-[#1B5E20] transition"
                  >
                    <Minus className="w-3 h-3 text-gray-600" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => onUpdateQty(product.id, quantity + 1)}
                    className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-[#1B5E20] transition"
                  >
                    <Plus className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onRemove(product.id)}
                    className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center hover:bg-red-100 transition ml-1"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center bg-[#1B5E20]/5 border border-[#1B5E20]/10 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-700">Subtotal</span>
            <span className="text-base font-bold text-[#1B5E20]">₹{cartTotal}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Order Settings ────────────────────────────────────────────────
function StepSettings({
  settings,
  onChange,
}: {
  settings: OrderSettings;
  onChange: <K extends keyof OrderSettings>(k: K, v: OrderSettings[K]) => void;
}) {
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              onClick={() => onChange("paymentMethod", m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                settings.paymentMethod === m
                  ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {settings.paymentMethod === "Other" && (
          <Input
            placeholder="Specify payment method…"
            value={settings.customPayment}
            onChange={(e) => onChange("customPayment", e.target.value)}
            className="mt-3 h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
          />
        )}
      </div>

      {/* Custom Date */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Custom Order Date</p>
          <p className="text-xs text-gray-500 mt-0.5">Defaults to right now if off</p>
        </div>
        <button
          onClick={() => onChange("useCustomDate", !settings.useCustomDate)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
            settings.useCustomDate ? "bg-[#1B5E20]" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.useCustomDate ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {settings.useCustomDate && (
        <Input
          type="datetime-local"
          value={settings.customDate || nowLocal}
          max={nowLocal}
          onChange={(e) => onChange("customDate", e.target.value)}
          className="h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
        />
      )}

      {/* iCarry Toggle */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Book iCarry Shipment</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Automatically book a shipment after order is created. You can still book later from the order row.
          </p>
        </div>
        <button
          onClick={() => onChange("bookICarry", !settings.bookICarry)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
            settings.bookICarry ? "bg-[#1B5E20]" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.bookICarry ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Discount Section */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Apply Discount</p>
          <p className="text-xs text-gray-500 mt-0.5">Manually discount this order</p>
        </div>
        <div className="flex gap-2">
          {(["none", "fixed", "percentage"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange("discountType", t);
                onChange("discountValue", "");
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all uppercase ${
                settings.discountType === t
                  ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5E20]"
              }`}
            >
              {t === "none" ? "None" : t === "fixed" ? "Fixed (₹)" : "Percent (%)"}
            </button>
          ))}
        </div>
        {settings.discountType !== "none" && (
          <Input
            type="number"
            min="0"
            placeholder={settings.discountType === "fixed" ? "e.g. 150" : "e.g. 10"}
            value={settings.discountValue}
            onChange={(e) => onChange("discountValue", e.target.value)}
            className="h-11 rounded-xl border-gray-200 focus:ring-[#1B5E20] focus:border-[#1B5E20]"
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Review ────────────────────────────────────────────────────────
function StepReview({
  customer,
  cart,
  settings,
}: {
  customer: CustomerInfo;
  cart: CartItem[];
  settings: OrderSettings;
}) {
  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);

  let adminDiscount = 0;
  if (settings.discountType === "percentage") {
    adminDiscount = Math.round((subtotal * (parseFloat(settings.discountValue) || 0)) / 100);
  } else if (settings.discountType === "fixed") {
    adminDiscount = Math.round(parseFloat(settings.discountValue) || 0);
  }
  const total = Math.max(0, subtotal - adminDiscount);

  const paymentDisplay =
    settings.paymentMethod === "Other" ? settings.customPayment || "Other" : settings.paymentMethod;

  return (
    <div className="space-y-4 text-sm">
      {/* Customer */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
        <h4 className="font-bold text-gray-900 mb-2 text-xs uppercase tracking-wider text-gray-500">Customer</h4>
        <p><span className="font-medium text-gray-500 mr-2">Name:</span>{customer.name}</p>
        <p><span className="font-medium text-gray-500 mr-2">Email:</span>{customer.email}</p>
        <p><span className="font-medium text-gray-500 mr-2">Phone:</span>{customer.phone}</p>
        <p><span className="font-medium text-gray-500 mr-2">Address:</span>{customer.address}, {customer.city}, {customer.state} – {customer.zip}</p>
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">Order Items</h4>
        {cart.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between items-center">
            <span className="text-gray-700">{product.name} × {quantity}</span>
            <span className="font-bold text-gray-900">₹{product.price * quantity}</span>
          </div>
        ))}
        
        <div className="pt-2 mt-1 border-t border-gray-200 space-y-1.5">
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          {adminDiscount > 0 && (
            <div className="flex justify-between items-center text-[#1B5E20] text-xs bg-green-50/50 p-1.5 rounded-lg">
              <span>Admin Discount</span>
              <span className="font-semibold">-₹{adminDiscount}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-[#1B5E20] text-lg">₹{total}</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
        <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">Settings</h4>
        <p><span className="font-medium text-gray-500 mr-2">Payment:</span>{paymentDisplay}</p>
        <p>
          <span className="font-medium text-gray-500 mr-2">iCarry Shipment:</span>
          <span className={settings.bookICarry ? "text-[#1B5E20] font-semibold" : "text-gray-400"}>
            {settings.bookICarry ? "✓ Will be booked automatically" : "✗ Skip (book later manually)"}
          </span>
        </p>
        {settings.useCustomDate && settings.customDate && (
          <p><span className="font-medium text-gray-500 mr-2">Order Date:</span>{new Date(settings.customDate).toLocaleString()}</p>
        )}
        <p>
          <span className="font-medium text-gray-500 mr-2">Initial Status:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">paid</span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export function CreateManualOrderModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [invoicing, setInvoicing] = useState(false);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "", email: "", phone: "", address: "", city: "", state: "", zip: "",
  });

  const [cart, setCart] = useState<CartItem[]>([]);

  const [settings, setSettings] = useState<OrderSettings>({
    paymentMethod: "Cash",
    customPayment: "",
    useCustomDate: false,
    customDate: "",
    bookICarry: true,
    discountType: "none",
    discountValue: "",
  });

  const backdropRef = useRef<HTMLDivElement>(null);

  // ── Validation ────────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (step === 0) {
      return !!(customer.name && customer.email && customer.phone && customer.address && customer.city && customer.state && customer.zip);
    }
    if (step === 1) return cart.length > 0;
    if (step === 2) {
      if (settings.paymentMethod === "Other") return !!settings.customPayment.trim();
      return !!settings.paymentMethod;
    }
    return true;
  };

  // ── Cart helpers ──────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    setCart((prev) => {
      if (prev.find((c) => c.product.id === product.id)) return prev;
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== productId));
    } else {
      setCart((prev) => prev.map((c) => c.product.id === productId ? { ...c, quantity: qty } : c));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const paymentMethod =
        settings.paymentMethod === "Other"
          ? settings.customPayment || "Other"
          : settings.paymentMethod;

      const date =
        settings.useCustomDate && settings.customDate
          ? new Date(settings.customDate).toISOString()
          : new Date().toISOString();

      const items = cart.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      }));

      const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
      let adminDiscount = 0;
      if (settings.discountType === "percentage") {
        adminDiscount = Math.round((subtotal * (parseFloat(settings.discountValue) || 0)) / 100);
      } else if (settings.discountType === "fixed") {
        adminDiscount = Math.round(parseFloat(settings.discountValue) || 0);
      }
      const totalAmount = Math.max(0, subtotal - adminDiscount);

      const result = await createManualOrder({
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        items,
        totalAmount,
        paymentMethod,
        date,
        bookICarry: settings.bookICarry,
        adminDiscount,
      });

      if (!result.success) throw new Error(result.error || "Order creation failed");

      // Build a local Order object for invoice generation
      const newOrder: Order = {
        id: result.orderId,
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        items,
        totalAmount,
        paymentMethod,
        status: "paid",
        date,
        adminDiscount,
      };

      setCreatedOrder(newOrder);
      onSuccess(); // trigger table refresh
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Invoice download ──────────────────────────────────────────────────
  const handleDownloadInvoice = async () => {
    if (!createdOrder) return;
    setInvoicing(true);
    try {
      await generateInvoice(createdOrder);
    } catch (e: any) {
      alert(`Invoice generation failed: ${e.message}`);
    } finally {
      setInvoicing(false);
    }
  };

  // ── Backdrop click ────────────────────────────────────────────────────
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-0 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-serif">Create Manual Order</h2>
              <p className="text-sm text-gray-500 mt-0.5">Admin — bypasses payment gateway</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 pt-6 pb-4">
            {!createdOrder ? (
              <>
                <StepIndicator current={step} />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.18 }}
                  >
                    {step === 0 && (
                      <StepCustomer
                        info={customer}
                        onChange={(k, v) => setCustomer((prev) => ({ ...prev, [k]: v }))}
                      />
                    )}
                    {step === 1 && (
                      <StepProducts
                        cart={cart}
                        onAdd={addToCart}
                        onUpdateQty={updateQty}
                        onRemove={removeFromCart}
                      />
                    )}
                    {step === 2 && (
                      <StepSettings
                        settings={settings}
                        onChange={(k, v) => setSettings((prev) => ({ ...prev, [k]: v }))}
                      />
                    )}
                    {step === 3 && (
                      <StepReview customer={customer} cart={cart} settings={settings} />
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                    ⚠️ {error}
                  </div>
                )}
              </>
            ) : (
              /* ── Success State ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-8 gap-5"
              >
                <div className="w-16 h-16 rounded-full bg-[#1B5E20]/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#1B5E20]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order Created!</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Order <span className="font-mono font-bold text-gray-900">{createdOrder.id}</span> has been saved.
                  </p>
                  {settings.bookICarry && (
                    <p className="text-xs text-[#1B5E20] font-medium mt-2 bg-[#1B5E20]/5 px-3 py-1.5 rounded-full inline-block">
                      iCarry shipment booking was triggered — check the order row for AWB details.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={invoicing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#164a1a] disabled:opacity-50 transition"
                  >
                    {invoicing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {invoicing ? "Generating…" : "Download Invoice"}
                  </button>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer — navigation buttons (hidden on success) */}
          {!createdOrder && (
            <div className="flex-shrink-0 px-8 pb-7 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {cart.length > 0 && step < 3 && (
                  <span>
                    <span className="font-bold text-gray-900">{cart.length}</span> item{cart.length !== 1 ? "s" : ""} ·{" "}
                    <span className="font-bold text-[#1B5E20]">₹{total}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canProceed()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#164a1a] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1B5E20] text-white rounded-xl font-semibold text-sm hover:bg-[#164a1a] disabled:opacity-50 transition"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                    ) : (
                      <><Check className="w-4 h-4" /> Create Order</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
