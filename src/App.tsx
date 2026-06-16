/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, Component, ErrorInfo, ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "@/pages/Home";

// Lazy load pages for performance
const Shop = lazy(() => import("@/pages/Shop"));
const Blogs = lazy(() => import("@/pages/Blogs"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Success = lazy(() => import("@/pages/Success"));
const ScanMe = lazy(() => import("@/pages/ScanMe"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const HowWeWork = lazy(() => import("@/pages/HowWeWork"));
const Recipes = lazy(() => import("@/pages/Recipes"));
const HoneyMap = lazy(() => import("@/pages/HoneyMap"));
const HealthCalculator = lazy(() => import("@/pages/HealthCalculator"));
const Compare = lazy(() => import("@/pages/Compare"));
const GiftCards = lazy(() => import("@/pages/GiftCards"));
const Referral = lazy(() => import("@/pages/Referral"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const Admin = lazy(() => import("@/pages/Admin")); // Lazy load Admin to prevent it from crashing the whole app

class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Global Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#fff0f0', minHeight: '100vh' }}>
          <h1 style={{ color: '#d32f2f' }}>Fatal Application Error</h1>
          <p>The application encountered a critical error and could not render.</p>
          <pre style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '12px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0A1F0B]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3A8E3C]"></div>
      <p className="text-xs text-[#6B9E6E] uppercase tracking-widest font-inter">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/how-we-work" element={<HowWeWork />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blog/:id" element={<BlogPost />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/honey-map" element={<HoneyMap />} />
                <Route path="/health-calculator" element={<HealthCalculator />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/gift-cards" element={<GiftCards />} />
                <Route path="/referral" element={<Referral />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/success" element={<Success />} />
                <Route path="/scanme" element={<ScanMe />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
