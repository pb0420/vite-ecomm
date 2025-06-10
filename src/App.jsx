import React from 'react';
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
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';

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
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';
import StripePaymentPage from '@/pages/StripePaymentPage';
import ContactPage from '@/pages/ContactPage';
import WorkPage from '@/pages/WorkPage';

const App = () => {
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
                    <Route path="/store-pickup" element={<StorePickupPage />} />
                    <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
                    {/* <Route path="/login" element={<LoginPage />} /> */}
                    <Route path="/admin-login" element={<AdminLoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/account/*" element={<AccountPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/stripe-payment" element={<StripePaymentPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/work" element={<WorkPage />} />
                  </Routes>
                </AnimatePresence>
              </main>
              <Footer />
              <CartDrawer />
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </OrderProvider>
    </AuthProvider>
  );
};

export default App;