import Cookies from "js-cookie";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  image: string;
  features: string[];
  category: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  allow_subscription?: boolean;
  subscription_discount?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isSubscription?: boolean;
  ribbon?: string;
  subtitle?: string;
  rating_override?: number;
  bought_count?: string;
  weight_grams?: number;
  length_cm?: number;
  breadth_cm?: number;
  height_cm?: number;
  about_items?: string[];
  purity_profile?: {
    glucose_fructose_ratio: string;
    moisture_content: string;
    pollen_count: string;
    sucrose_content: string;
    hmf_level: string;
  };
  product_info?: {
    brand: string;
    net_weight: string;
    package_type: string;
    source: string;
    extraction: string;
    shelf_life: string;
    storage: string;
    certifications: string;
    country_of_origin: string;
  };
}

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

async function fetchAuth(url: string, options: RequestInit = {}) {
  const token = Cookies.get("admin_token");
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Request to ${url} failed with status ${res.status}: ${res.statusText}. Response: ${errorBody}`);
  }
  return res.json().catch(err => {
    throw new Error(`Failed to parse JSON response from ${url}: ${err.message}`);
  });
}

async function fetchPublic(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Request to ${url} failed with status ${res.status}: ${res.statusText}. Response: ${errorBody}`);
  }
  return res.json().catch(err => {
    throw new Error(`Failed to parse JSON response from ${url}: ${err.message}`);
  });
}

export async function uploadImage(file: File): Promise<{ success: boolean; url: string; filename: string }> {
  const formData = new FormData();
  formData.append("image", file);

  return fetchAuth("/api/upload", {
    method: "POST",
    body: formData,
    // Note: Don't set Content-Type header manually when sending FormData, 
    // the browser will set it automatically with the correct boundary
  });
}

export async function getProducts(): Promise<Product[]> {
  return fetchPublic("/api/products");
}

export async function getPublicSettings(): Promise<any> {
  return fetchPublic("/api/public_settings");
}

export async function getSettings(): Promise<any> {
  return fetchAuth("/api/settings");
}

export async function getProduct(id: number): Promise<Product> {
  return fetchPublic(`/api/products/${id}`);
}

export async function createProduct(product: Omit<Product, "id">) {
  return fetchAuth("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: number, product: Omit<Product, "id">) {
  return fetchAuth(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: number) {
  return fetchAuth(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function getBlogs(): Promise<Blog[]> {
  return fetchPublic("/api/blogs");
}

export async function getBlog(id: number): Promise<Blog> {
  return fetchPublic(`/api/blogs/${id}`);
}

export async function createBlog(blog: Omit<Blog, "id">) {
  return fetchAuth("/api/blogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blog),
  });
}

export async function updateBlog(id: number, blog: Omit<Blog, "id">) {
  return fetchAuth(`/api/blogs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blog),
  });
}

export async function deleteBlog(id: number) {
  return fetchAuth(`/api/blogs/${id}`, {
    method: "DELETE",
  });
}

// ----- New Admin & E-Commerce APIs -----

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentId?: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  is_subscription?: boolean;
  icarry_shipment_id?: string;
  icarry_awb?: string;
  icarry_tracking_url?: string;
  icarry_status?: string;
  icarry_error?: string;
  date: string;
}


export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  ordersCount: number;
  joinDate: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  unreadInquiries: number;
  pendingReviews: number;
  recentOrders: Order[];
}

// ----- Analytics Dashboard API -----
export interface AnalyticsDashboard {
  revenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  avgOrderValue: number;
  conversionRate: number;
  cac: number;
  newCustomers: number;
  clv: number;
  repeatRate: number;
  repeatCustomers: number;
  totalCustomers: number;
  cartAbandonmentRate: number;
  csatAvg: number;
  csatPercent: number;
  csatCount: number;
  ratingDistribution: { rating: number; count: number }[];
  npsScore: number;
  npsTotal: number;
  npsBreakdown: { name: string; value: number }[];
  trafficSources: { name: string; value: number }[];
  revenueTrend: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  recentOrders: Order[];
  unreadInquiries: number;
  pendingReviews: number;
  visits: number;
  dateRange: { from: string; to: string };
}

export async function getAnalyticsDashboard(from: string, to: string): Promise<AnalyticsDashboard> {
  return fetchAuth(`/api/dashboard_analytics?from=${from}&to=${to}`);
}

export async function verifyRazorpayPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await fetch("/api/verify_razorpay_payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

// ----- Promo Codes API -----
export interface PromoCode {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  expiryDate: string;
  status: 'active' | 'inactive';
  totalLimit: number;
  usedCount: number;
  oneTimePerUser: boolean;
  is_private?: boolean;
}

export interface PromoCodeUsage {
  id: number;
  promo_code_id: number;
  email: string;
  phone: string;
  used_at: string;
}

export async function getPromoCodes(): Promise<PromoCode[]> {
  return fetchAuth("/api/promo_codes");
}

export async function createPromoCode(promo: Partial<PromoCode>) {
  return fetchAuth("/api/promo_codes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promo)
  });
}

export async function updatePromoCode(id: number, promo: Partial<PromoCode>) {
  return fetchAuth(`/api/promo_codes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promo)
  });
}

export async function updatePromoStatus(id: number, status: string) {
  return fetchAuth(`/api/promo_codes/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

export async function deletePromoCode(id: number) {
  return fetchAuth(`/api/promo_codes/${id}`, {
    method: "DELETE"
  });
}

export async function validatePromoCode(code: string, cartTotal: number, email?: string, phone?: string) {
  const res = await fetch("/api/promo_codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, cartTotal, email, phone })
  });
  return res.json();
}

// ----- Inquiries API -----
export interface Inquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'resolved';
  date: string;
}

export async function getInquiries(): Promise<Inquiry[]> {
  return fetchAuth("/api/inquiries");
}

export async function createInquiry(inquiry: Partial<Inquiry>) {
  return fetchPublic("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry)
  });
}

export async function updateInquiryStatus(id: number, status: string) {
  return fetchAuth(`/api/inquiries/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// ----- Reviews API -----
export interface Review {
  id: number;
  productId: number;
  productName?: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export async function getReviews(): Promise<Review[]> {
  return fetchAuth("/api/reviews");
}

export async function getProductReviews(productId: number): Promise<Review[]> {
  return fetchPublic(`/api/products/${productId}/reviews`);
}

export async function createReview(review: Partial<Review>) {
  return fetchPublic("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review)
  });
}

export async function updateReviewStatus(id: number, status: string) {
  return fetchAuth(`/api/reviews/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

// ----- Referrals API -----
export interface Referral {
  id: number;
  referrerEmail: string;
  referredEmail: string;
  status: 'pending' | 'completed';
  rewardCode?: string;
  date: string;
}

export async function getReferrals(): Promise<Referral[]> {
  return fetchAuth("/api/referrals");
}

export async function createReferral(referral: Partial<Referral>) {
  return fetchPublic("/api/referrals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(referral)
  });
}

// Existing Dashboard, Orders, Customers, Admin Logic Below
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchAuth("/api/dashboard");
}

export async function getOrders(): Promise<Order[]> {
  return fetchAuth("/api/orders");
}

export async function createRazorpayOrder(data: {
  items: { id: number; quantity: number; price: number; name: string }[];
  promoCode?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  shippingCost?: number;
}): Promise<{
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key: string;
  final_amount: number;
  discount: number;
  error?: string;
}> {
  return fetchPublic("/api/create_razorpay_order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function createOrder(orderData: any) {
  return fetchPublic("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  });
}

export async function checkPincode(pincode: string) {
  return fetchPublic("/api/check_pincode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pincode })
  });
}

export async function updateOrderStatus(id: string, status: string) {
  return fetchAuth(`/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

export async function bookOrderShipment(id: string): Promise<{ success: boolean; error?: string; awb?: string; shipment_id?: string; courier_name?: string; sentWeight?: number; sentDimensions?: string }> {
  return fetchAuth(`/api/orders/${id}/book_shipment`, { method: "POST" });
}

export async function cancelSubscription(orderId: string) {
  return fetchPublic("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, action: "cancel" })
  });
}

export async function getSubscriptions(orderId: string, contact: string): Promise<any[]> {
  return fetchPublic(`/api/subscriptions?orderId=${encodeURIComponent(orderId)}&contact=${encodeURIComponent(contact)}`);
}

export async function getAllSubscriptions(): Promise<any[]> {
  return fetchAuth(`/api/subscriptions`);
}

export async function updateAdminSubscriptionStatus(id: number, status: string) {
  return fetchAuth(`/api/subscriptions/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

export async function updateSubscriptionStatus(
  subscriptionId: number,
  action: 'pause' | 'resume' | 'cancel' | 'change_frequency',
  orderId: string,
  contact: string,
  frequency?: string
) {
  return fetchPublic("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId, action, orderId, contact, frequency })
  });
}

export async function getCustomers(): Promise<Customer[]> {
  return fetchAuth("/api/customers");
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const data = await res.json();
    return { success: false, error: data?.error || 'Login failed' };
  }
  return res.json();
}

// ----- Public Order Tracking API -----
export interface TrackedOrder {
  id: string;
  customerName: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  date: string;
  items: { name: string; quantity: number; price: number; image?: string }[];
  totalAmount: number;
  city?: string;
  state?: string;
  tracking?: {
    awb: string;
    tracking_url: string;
    current_status: string;
    courier_name?: string;
    eta_datetime?: string;
    picked_datetime?: string;
    delivered_datetime?: string;
    milestones?: {
      datetime: string;
      location: string;
      notes: string;
    }[];
  };
}

export async function trackOrder(orderId: string): Promise<{ success: boolean; order?: TrackedOrder; error?: string }> {
  const res = await fetch("/api/order_track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  });
  return res.json();
}

export async function trackOrdersByEmail(email: string): Promise<{ success: boolean; orders?: TrackedOrder[]; error?: string }> {
  const res = await fetch("/api/order_track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
}

// ----- Public Active Promos API -----
export interface ActivePromo {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  expiryDate?: string;
}

export async function getActivePromos(): Promise<{ success: boolean; promos?: ActivePromo[] }> {
  const res = await fetch("/api/active_promos");
  return res.json();
}

// ----- Google Reviews API -----
export interface GoogleReview {
  id: number;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  profilePhoto?: string;
  isVisible?: number;
  product_id?: number | null;
}

export interface GoogleReviewsResponse {
  reviews: GoogleReview[];
  aggregate: { rating: string; totalReviews: string; mapsUrl: string };
}

export async function getGoogleReviews(): Promise<GoogleReviewsResponse> {
  return fetchPublic("/api/google_reviews");
}

export async function getGoogleReviewsAdmin(): Promise<GoogleReviewsResponse> {
  return fetchAuth("/api/google_reviews");
}

export async function createGoogleReview(data: Partial<GoogleReview>) {
  return fetchAuth("/api/google_reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateGoogleReview(id: number, data: Partial<GoogleReview>) {
  return fetchAuth(`/api/google_reviews/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteGoogleReview(id: number) {
  return fetchAuth(`/api/google_reviews/${id}`, { method: "DELETE" });
}

// ═══════════════ BUNDLES ═══════════════
export interface Bundle {
  id: number; name: string; slug: string; description: string;
  discount_percent: number; discount_amount: number; image: string;
  is_active: number; items: BundleItem[]; originalPrice: number;
  bundlePrice: number; savings: number;
}
export interface BundleItem {
  product_id: number; quantity: number; product_name: string;
  price: number; image: string; stock: number;
}
export async function getBundles(): Promise<Bundle[]> {
  return fetchPublic("/api/bundles");
}
export async function getBundle(id: number): Promise<Bundle> {
  return fetchPublic(`/api/bundles/${id}`);
}
export async function createBundle(data: any) {
  return fetchAuth("/api/bundles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function updateBundle(id: number, data: any) {
  return fetchAuth(`/api/bundles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function deleteBundle(id: number) {
  return fetchAuth(`/api/bundles/${id}`, { method: "DELETE" });
}

// ═══════════════ NPS SURVEY ═══════════════
export async function submitNpsSurvey(score: number, comment?: string) {
  return fetchPublic("/api/nps_survey", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score, comment }),
  });
}

// ═══════════════ ADMIN NOTIFICATIONS ═══════════════
export interface AdminNotification {
  id: string; type: string; title: string; message: string;
  is_read: number; created_at: string; priority?: string;
}
export async function getAdminNotifications(): Promise<{ notifications: AdminNotification[]; unreadCount: number }> {
  return fetchAuth("/api/notifications");
}
export async function markNotificationsRead() {
  return fetchAuth("/api/notifications", {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markAllRead: true }),
  });
}

// ═══════════════ AUDIT LOG ═══════════════
export interface AuditLogEntry {
  id: number; admin_user: string; action: string; entity_type: string;
  entity_id: string; details: string; ip_address: string; created_at: string;
}
export async function getAuditLog(page = 1): Promise<{ logs: AuditLogEntry[]; total: number; page: number; pages: number }> {
  return fetchAuth(`/api/audit_log?page=${page}`);
}

// ═══════════════ EMAIL CAMPAIGNS ═══════════════
export async function getEmailCampaigns() {
  return fetchAuth("/api/email_campaigns");
}
export async function createEmailCampaign(data: any) {
  return fetchAuth("/api/email_campaigns/campaign", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
}
export async function sendEmailCampaign(campaignId: number) {
  return fetchAuth("/api/email_campaigns/send", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId }),
  });
}
export async function deleteEmailCampaign(campaignId: number) {
  return fetchAuth("/api/email_campaigns", {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: campaignId }),
  });
}
export async function updateEmailCampaign(id: number, data: any) {
  return fetchAuth("/api/email_campaigns", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }),
  });
}
export async function getAbandonedCarts() {
  return fetchAuth("/api/email_campaigns/abandoned");
}
export async function sendCartRecovery(cartId: number) {
  return fetchAuth("/api/email_campaigns/recover", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartId }),
  });
}

// ═══════════════ BACKUP ═══════════════
export async function createBackup() {
  return fetchAuth("/api/backup");
}

// ═══════════════ CUSTOMER SEGMENTATION ═══════════════
export async function getCustomerSegments() {
  return fetchAuth("/api/customers?segments=1");
}

// ═══════════════ ICARRY LOGISTICS ═══════════════
export async function getShippingEstimate(data: {
  origin_pincode: string;
  destination_pincode: string;
  weight: number;
  length: number;
  breadth: number;
  height: number;
  shipment_mode?: 'E' | 'S' | 'H';
  shipment_type?: 'C' | 'P';
  shipment_value?: number;
}) {
  return fetchPublic("/api/icarry/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

export async function getICarryTracking(shipment_id: string) {
  return fetchPublic("/api/icarry/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shipment_id })
  });
}
