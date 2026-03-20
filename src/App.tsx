import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CompareProvider } from "@/contexts/CompareContext";

import { CompareFloatingButton } from "@/components/products/CompareFloatingButton";
import { LiveChatWidget } from "./components/chat/LiveChatWidget";

import Index from "./pages/Index";
import SilverPage from "./pages/SilverPage";
import GoldPage from "./pages/GoldPage";
import ArtificialPage from "./pages/ArtificialPage";
import ContactPage from "./pages/ContactPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import WishlistPage from "./pages/WishlistPage";
import ComparePage from "./pages/ComparePage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import ProductDetailPage from "./pages/ProductDetailPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminReels from "./pages/admin/AdminReels";
import AdminChat from "./pages/admin/AdminChat";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

import ReelsPage from "./pages/ReelsPage";
import ReelUploadPage from "./pages/ReelUploadPage";
import UserReelsProfile from "./pages/UserReelsProfile";

import GiftsPage from "./pages/GiftsPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import ShippingInfoPage from "./pages/ShippingInfoPage";
import ReturnsPage from "./pages/ReturnsPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import FAQPage from "./pages/FAQPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />

              <BrowserRouter>
                <Routes>
                  {/* MAIN */}
                  <Route path="/" element={<Index />} />
                  <Route path="/silver" element={<SilverPage />} />
                  <Route path="/gold" element={<GoldPage />} />
                  <Route path="/artificial" element={<ArtificialPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  {/* SHOP */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/compare" element={<ComparePage />} />

                  {/* AUTH */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/account" element={<AccountPage />} />

                  {/* PRODUCT */}
                  <Route path="/product/:id" element={<ProductDetailPage />} />

                  {/* REELS */}
                  <Route path="/reels" element={<ReelsPage />} />
                  <Route path="/upload-reel" element={<ReelUploadPage />} />
                  <Route path="/my-reels" element={<UserReelsProfile />} />

                  {/* ADMIN */}
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                  <Route path="/admin/inquiries" element={<AdminInquiries />} />
                  <Route path="/admin/reels" element={<AdminReels />} />
                  <Route path="/admin/chat" element={<AdminChat />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />

                  {/* EXTRA */}
                  <Route path="/gifts" element={<GiftsPage />} />
                  <Route path="/track-order" element={<TrackOrderPage />} />
                  <Route path="/shipping" element={<ShippingInfoPage />} />
                  <Route path="/returns" element={<ReturnsPage />} />
                  <Route path="/size-guide" element={<SizeGuidePage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/about" element={<AboutPage />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>

                {/* FLOATING COMPONENTS */}
                <CompareFloatingButton />
                <LiveChatWidget />
              </BrowserRouter>
            </TooltipProvider>
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default App;