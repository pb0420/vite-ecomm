import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Contexts
import { CartProvider } from '@/contexts/CartContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Layout Components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTopButton from '@/components/ui/scroll-to-top-btn';


// Pages
import HomePage from '@/pages/HomePage';
import ShopPage from '@/pages/ShopPage';
import CategoriesPage from '@/pages/CategoriesPage';
import CategoryPage from '@/pages/CategoryPage';
import ProductPage from '@/pages/ProductPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
// import LoginPage from '@/pages/LoginPage';
import AdminLoginPage from '@/pages/AdminLoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AccountPage from '@/pages/AccountPage';
import AdminPage from '@/pages/AdminPage';
import StorePickupPage from '@/pages/StorePickupPage';
import PickupPaymentPage from '@/pages/PickupPaymentPage';
import PickupOrderDetailsPage from '@/pages/PickupOrderDetailsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import StripePaymentPage from '@/pages/StripePaymentPage';
import ContactPage from '@/pages/ContactPage';
import WorkPage from '@/pages/WorkPage';
import AiChatBot from '@/components/chat/AiChatBot'; 
import PwaUpdateBanner from '@/components/pwa/PwaUpdateBanner';



import { purgeQueryCache } from '@/lib/queryCache';

const App = () => {
  useEffect(() => {
    purgeQueryCache();
  },[])
  return (
    <AuthProvider>
      <OrderProvider>
        <CartProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-background font-sans antialiased">
              <Header />
              <main className="flex-1">
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:id" element={<CategoryPage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/grocery-run" element={<StorePickupPage />} />
                    <Route path="/pickup-payment" element={<PickupPaymentPage />} />
                    <Route path="/pickup-order/:id" element={<PickupOrderDetailsPage />} />
                    <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                    {/* <Route path="/login" element={<LoginPage />} /> */}
                    <Route path="/admin-login" element={<AdminLoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/stripe-payment" element={<StripePaymentPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/work" element={<WorkPage />} />
                    <Route path="*" element={<div><h1>404 - Page not Found</h1><p>Click the top-left icon to return to home</p></div>} />
                  </Routes>
                </AnimatePresence>
              </main>
              <AiChatBot />
              <ScrollToTopButton />
              <Footer />
              <CartDrawer />
              <Toaster />
              <PwaUpdateBanner />
            </div>
          </Router>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
};

export default App;