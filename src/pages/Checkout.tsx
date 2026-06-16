import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRazorpay } from "@/hooks/useRazorpay";
import { CheckCircle, Truck, CreditCard, Banknote, ShieldCheck, ArrowLeft, ShoppingBag, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { createOrder, createRazorpayOrder, verifyRazorpayPayment, validatePromoCode, getActivePromos, ActivePromo, getShippingEstimate } from "@/lib/api";

interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  paymentMethod: "razorpay" | "cod";
}

export default function Checkout() {
  const { items, totalPrice: originalTotalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const isRazorpayLoaded = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      paymentMethod: "razorpay",
    },
  });

  // Promo code state
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ id: number; code: string; type: "percentage" | "fixed"; value: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<ActivePromo[]>([]);
  const [searchParams] = useSearchParams();

  // Shipping state
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [shippingError, setShippingError] = useState("");

  useEffect(() => {
    getActivePromos().then(res => {
      if (res.success && res.promos) {
        setAvailablePromos(res.promos);
      }
    });
  }, []);

  // Auto-apply promo from URL param (?promo=CODE)
  useEffect(() => {
    const urlPromo = searchParams.get('promo');
    if (urlPromo && !appliedPromo) {
      setPromoCodeInput(urlPromo.toUpperCase());
    }
  }, [searchParams]);

  // Calculate total price with discount, ensuring no floats
  const rawDiscountAmount = appliedPromo
    ? (appliedPromo.type === "percentage" ? (originalTotalPrice * appliedPromo.value) / 100 : appliedPromo.value)
    : 0;
  const discountAmount = Math.round(rawDiscountAmount);
  const shippingCost = selectedRate ? Math.ceil(selectedRate.courier_cost || 0) : 0;
  const totalPrice = Math.max(0, originalTotalPrice - discountAmount + shippingCost);

  const zip = watch("zip");
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinLookupError, setPinLookupError] = useState("");

  useEffect(() => {
    if (zip && zip.length === 6 && /^[1-9][0-9]{5}$/.test(zip)) {
      fetchRates(zip);
      lookupPincode(zip);
    } else {
      setShippingRates([]);
      setSelectedRate(null);
      setPinLookupError("");
    }
  }, [zip]);

  // Auto-fill city + state from an Indian PIN code.
  const lookupPincode = async (pincode: string) => {
    setIsLookingUpPin(true);
    setPinLookupError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : null;
      if (entry?.Status === "Success" && entry.PostOffice?.length) {
        const po = entry.PostOffice[0];
        // Prefer District as the city; fall back to the post office's region.
        setValue("city", po.District || po.Block || po.Name || "", { shouldValidate: true });
        setValue("state", po.State || "", { shouldValidate: true });
      } else {
        setPinLookupError("Couldn't find that PIN code — please enter city/state manually.");
      }
    } catch {
      setPinLookupError("PIN lookup failed — please enter city/state manually.");
    } finally {
      setIsLookingUpPin(false);
    }
  };

  const fetchRates = async (pincode: string) => {
    setIsFetchingRates(true);
    setShippingError("");
    try {
      // Calculate total weight (default 500g per item if not specified)
      const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 500), 0);
      
      const res = await getShippingEstimate({
        origin_pincode: "400071", // Adjust your origin pincode
        destination_pincode: pincode,
        weight: totalWeight,
        length: 15, breadth: 15, height: 10, // Default box size
        shipment_mode: "S",
        shipment_type: "P",
        shipment_value: originalTotalPrice
      });

      if (res && Array.isArray(res)) {
        setShippingRates(res);
        if (res.length > 0) {
          // Select cheapest by default
          const cheapest = res.reduce((min, r) => (r.courier_cost < min.courier_cost ? r : min), res[0]);
          setSelectedRate(cheapest);
        }
      } else if (res && res.status === "error") {
        setShippingError(res.message || "Shipping not available for this area");
      }
    } catch (e) {
      setShippingError("Failed to fetch shipping rates");
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;

    setIsApplyingPromo(true);
    setPromoError("");

    try {
      // Pass email and phone for one-time use validation
      const email = watch("email");
      const phone = watch("phone");

      const res = await validatePromoCode(promoCodeInput, originalTotalPrice, email, phone);
      if (res.success) {
        setAppliedPromo({
          id: res.id,
          code: promoCodeInput.toUpperCase(),
          type: res.discountType,
          value: res.discountValue
        });
        setPromoCodeInput("");
      } else {
        setPromoError(res.error || "Invalid promo code");
      }
    } catch (e) {
      setPromoError("Failed to validate promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const clearPromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };


  const paymentMethod = watch("paymentMethod");

  if (items.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center text-center bg-[#FAFAFA]">
        <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-10 w-10 text-[#1B5E20]" />
        </div>
        <h2 className="text-3xl font-bold text-[#1B5E20] font-serif mb-2">Your cart is empty</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">Looks like you haven't added any of our delicious honey to your cart yet.</p>
        <Button className="mt-8 rounded-full px-8 py-6 text-lg" onClick={() => navigate("/shop")}>
          Go to Shop
        </Button>
      </div>
    );
  }

  const handlePaymentError = (msg: string) => {
    setPaymentError(msg);
    setIsProcessing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    setPaymentError("");
    setIsProcessing(true);

    // Build order payload
    const orderData = {
      id: `ORD-${Date.now()}`,
      customerName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        isSubscription: i.isSubscription,
        frequency: i.frequency
      })),
      totalAmount: Math.round(totalPrice),
      paymentMethod: data.paymentMethod,
      promoCodeId: appliedPromo?.id || null,
      isSubscription: items.some(i => i.isSubscription),
      date: new Date().toISOString()
    };

    if (data.paymentMethod === "cod") {
      try {
        const response = await createOrder({ ...orderData, paymentId: null });
        if (!response || response.error) {
          throw new Error(response?.error || "Unknown server error");
        }
        clearCart();
        try {
          navigate("/success", { state: { orderId: response.orderId } });
        } catch (e) {
          window.location.href = `/success`;
        }
      } catch (error: any) {
        handlePaymentError(`Failed to create order: ${error.message}. Please try again.`);
      }
    } else {
      if (!isRazorpayLoaded) {
        handlePaymentError("Razorpay SDK failed to load. Please check your connection.");
        return;
      }

      try {
        // Step 1: Create server-side Razorpay order (with DB price validation)
        const rzpOrder = await createRazorpayOrder({
          items: items.map(i => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
            name: i.name
          })),
          promoCode: appliedPromo?.code,
          customerInfo: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip
          },
          shippingCost: shippingCost
        });

        if (!rzpOrder.success || !rzpOrder.order_id) {
          handlePaymentError(rzpOrder.order_id === "null" ? "Failed to create payment order. Please try again." : (rzpOrder.error || "Failed to create payment order. Please try again."));
          return;
        }

        // Step 2: Open Razorpay with server-created order
        const options = {
          key: rzpOrder.razorpay_key,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "Live Green Honey",
          description: "Premium Raw Honey",
          image: "https://www.livegreenfarms.in/assets/live-green-logo.png",
          order_id: rzpOrder.order_id,
          handler: async function (response: any) {
            try {
              // Step 3: Verify payment on server
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (!verifyRes.success) {
                throw new Error(verifyRes.error || "Payment verification failed");
              }

              // Step 4: Record success (already handled by server verification for status)
              clearCart();
              navigate("/success", {
                state: {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                },
              });
            } catch (error: any) {
              handlePaymentError(`Payment verification failed: ${error.message}. Please contact support.`);
            }
          },
          prefill: {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            contact: data.phone,
          },
          theme: {
            color: "#1B5E20",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          handlePaymentError(`Payment declined: ${response.error.description}`);
        });
        rzp.open();
      } catch (error) {
        handlePaymentError("Failed to initiate payment. Please try again.");
      }
    }
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen py-12 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full w-10 h-10 p-0 hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h1 className="text-3xl font-bold text-[#1B5E20] font-serif">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
          {/* Form Section */}
          <div className="lg:col-span-7">
            {paymentError && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-800 text-lg mb-1">Payment Failed</h3>
                  <p className="text-red-700 text-sm">{paymentError}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-[#1B5E20] font-bold text-sm">1</div>
                  <h2 className="text-xl font-bold text-[#1B5E20] font-serif">Contact Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      {...register("email", { required: "Email is required" })}
                      placeholder="you@example.com"
                      className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      type="tel"
                      {...register("phone", { required: "Phone is required" })}
                      placeholder="+91 98765 43210"
                      className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                </div>
              </motion.div>

              {/* Shipping Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-[#1B5E20] font-bold text-sm">2</div>
                  <h2 className="text-xl font-bold text-[#1B5E20] font-serif">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <Input {...register("firstName", { required: "Required" })} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <Input {...register("lastName", { required: "Required" })} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <Input {...register("address", { required: "Required" })} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">City</label>
                    <Input {...register("city", { required: "Required" })} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <Input {...register("state", { required: "Required" })} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
                    {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">PIN Code</label>
                    <Input
                      {...register("zip", {
                        required: "Required",
                        pattern: { value: /^[1-9][0-9]{5}$/, message: "Enter a valid 6-digit Indian PIN code" }
                      })}
                      className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      maxLength={6}
                      placeholder="e.g. 500001"
                      inputMode="numeric"
                    />
                    {errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip.message}</p>}
                    {isLookingUpPin && <p className="mt-1 text-xs text-gray-400">Looking up city &amp; state…</p>}
                    {pinLookupError && !errors.zip && <p className="mt-1 text-xs text-amber-600">{pinLookupError}</p>}
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-[#1B5E20] font-bold text-sm">3</div>
                  <h2 className="text-xl font-bold text-[#1B5E20] font-serif">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-5 transition-all duration-200",
                      paymentMethod === "razorpay"
                        ? "border-[#1B5E20] bg-green-50/50 ring-1 ring-[#1B5E20] shadow-sm"
                        : "border-gray-200 hover:border-green-200 hover:bg-gray-50"
                    )}
                    onClick={() => setValue("paymentMethod", "razorpay")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#1B5E20]">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1B5E20] block">Pay Online</span>
                        <span className="text-xs text-gray-500">Credit/Debit Card, UPI, NetBanking</span>
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded-full border border-[#1B5E20] p-0.5 flex items-center justify-center">
                      {paymentMethod === "razorpay" && <div className="h-full w-full rounded-full bg-[#1B5E20]" />}
                    </div>
                  </div>

                  {/* Cash on Delivery hidden temporarily 
                  <div
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-5 transition-all duration-200",
                      paymentMethod === "cod"
                        ? "border-[#1B5E20] bg-green-50/50 ring-1 ring-[#1B5E20] shadow-sm"
                        : "border-gray-200 hover:border-green-200 hover:bg-gray-50"
                    )}
                    onClick={() => setValue("paymentMethod", "cod")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#1B5E20]">
                        <Banknote className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-[#1B5E20] block">Cash on Delivery</span>
                        <span className="text-xs text-gray-500">Pay when you receive your order</span>
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded-full border border-[#1B5E20] p-0.5 flex items-center justify-center">
                      {paymentMethod === "cod" && <div className="h-full w-full rounded-full bg-[#1B5E20]" />}
                    </div>
                  </div> 
                  */}
                </div>
              </motion.div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg rounded-xl bg-[#1B5E20] hover:bg-[#144a18] shadow-lg shadow-green-900/20"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  `Pay ₹${totalPrice}`
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="sticky top-24 rounded-3xl bg-white p-8 shadow-lg border border-gray-100"
            >
              <h2 className="mb-6 text-xl font-bold text-[#1B5E20] font-serif">Order Summary</h2>
              <div className="space-y-6 border-b border-gray-100 pb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1B5E20] line-clamp-1">{item.name}</h3>
                        {item.isSubscription && (
                          <span className="text-[10px] font-black text-white bg-[#1B5E20] px-1.5 py-0.5 rounded uppercase">Sub</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{(item.product_info?.net_weight || item.name?.match(/\(([^)]+)\)/)?.[1] || '') + ' '}Jar {item.isSubscription && `• Deliver ${item.frequency}`}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
                          <button
                            className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-[#1B5E20] transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.isSubscription)}
                          >
                            -
                          </button>
                          <span className="text-sm font-medium text-gray-900 w-4 text-center">{item.quantity}</span>
                          <button
                            className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-[#1B5E20] transition-colors"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.isSubscription)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.isSubscription)}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1B5E20]">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{originalTotalPrice}</span>
                </div>

                {/* Promo Code Input */}
                <div className="py-2">
                  {appliedPromo ? (
                    <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-bold">{appliedPromo.code}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">-₹{discountAmount.toFixed(0)}</span>
                        <button onClick={clearPromo} className="text-emerald-700 hover:text-emerald-900 border-l border-emerald-200 pl-3 text-sm">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Promo code"
                          value={promoCodeInput}
                          onChange={(e) => {
                            setPromoCodeInput(e.target.value);
                            setPromoError("");
                          }}
                          className="h-10 rounded-lg bg-gray-50 uppercase"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromo}
                          disabled={isApplyingPromo || !promoCodeInput.trim()}
                          className="h-10 px-4 rounded-lg"
                        >
                          {isApplyingPromo ? "..." : "Apply"}
                        </Button>
                      </div>
                      {promoError && <p className="mt-2 text-xs text-red-500">{promoError}</p>}
                      {availablePromos.length > 0 && !appliedPromo && (
                        <div className="mt-6">
                          <p className="text-[10px] font-bold text-honey uppercase tracking-[0.2em] font-inter mb-3">Available Offers</p>
                          <div className="grid gap-3">
                            {availablePromos.map((promo) => {
                              const isEligible = originalTotalPrice >= promo.minSpend;
                              return (
                                <motion.div
                                  key={promo.code}
                                  whileHover={isEligible ? { scale: 1.02 } : {}}
                                  whileTap={isEligible ? { scale: 0.98 } : {}}
                                  onClick={() => {
                                    if (isEligible) {
                                      setPromoCodeInput(promo.code);
                                    }
                                  }}
                                  className={cn(
                                    "relative overflow-hidden p-4 rounded-2xl border transition-all duration-300",
                                    isEligible
                                      ? "border-forest/10 bg-gradient-to-br from-forest/5 to-honey/5 hover:shadow-md cursor-pointer group"
                                      : "border-gray-100 bg-gray-50/50 grayscale opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  {isEligible && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-honey/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2 group-hover:bg-honey/20 transition-colors" />
                                  )}

                                  <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-forest border border-forest/20 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-inter uppercase">{promo.code}</span>
                                        <span className="text-[11px] font-semibold text-forest/70">
                                          {promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                                        </span>
                                      </div>
                                      {!isEligible && (
                                        <span className="text-[10px] text-red-500 font-medium tracking-wide">Add ₹{(promo.minSpend - originalTotalPrice).toFixed(0)} more to unlock</span>
                                      )}
                                      {isEligible && promo.minSpend > 0 && (
                                        <span className="text-[10px] text-forest/50 font-inter">On orders above ₹{promo.minSpend}</span>
                                      )}
                                    </div>

                                    {isEligible && (
                                      <div className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-colors">
                                        <ArrowLeft className="h-3 w-3 rotate-180" />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  {isFetchingRates ? (
                    <span className="animate-pulse text-honey">Calculating...</span>
                  ) : shippingError ? (
                    <span className="text-red-500 text-xs">{shippingError}</span>
                  ) : selectedRate ? (
                    <span className="font-medium text-forest">₹{shippingCost}</span>
                  ) : (
                    <span className="text-gray-400">Enter PIN code</span>
                  )}
                </div>

                {shippingRates.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Options</p>
                    <div className="space-y-2">
                      {shippingRates.slice(0, 3).map((rate) => (
                        <div
                          key={rate.courier_id}
                          onClick={() => setSelectedRate(rate)}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer transition-all",
                            selectedRate?.courier_id === rate.courier_id
                              ? "border-forest bg-green-50/50 shadow-sm"
                              : "border-gray-100 hover:border-green-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-4 w-4 rounded-full border flex items-center justify-center",
                              selectedRate?.courier_id === rate.courier_id ? "border-forest" : "border-gray-300"
                            )}>
                              {selectedRate?.courier_id === rate.courier_id && <div className="h-2 w-2 rounded-full bg-forest" />}
                            </div>
                            <span className="font-medium text-gray-700">{rate.courier_name}</span>
                          </div>
                          <span className="font-bold text-forest">₹{Math.ceil(rate.courier_cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-100 pt-4 text-xl font-bold text-[#1B5E20]">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 py-3 rounded-lg">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
