import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MessageCircle } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const clearStorage = () => {
    if (window.confirm("Are you sure you want to clear local storage, session storage, and cookies?")) {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.reload();
    }
  };

  return (
    <footer className="bg-white border-t">
      <div className="container px-4 py-12 mx-auto md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="space-y-4 md:col-span-1 flex flex-col items-center md:items-start">
            <div
              style={{
                backgroundImage: 'url(https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/logo.webp)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                width: '100px',
                height: '40px',
              }}
              aria-label="Groceroo Logo"
            ></div>
            <div className="text-xs text-gray-500">ABN 257 558 402 06</div>
            <p className="text-sm text-gray-600 text-center md:text-left">
              Express grocery shopping and delivery service in Adelaide.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/groceroo_adl?igsh=bXFmN2J2cHp3cHQ=" className="text-gray-500 hover:text-primary">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            <h4 className="text-xs font-semibold text-primary mb-2 tracking-wide uppercase">Shop</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/categories" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/shop" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Featured Items
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:col-span-1">
            <h4 className="text-xs font-semibold text-primary mb-2 tracking-wide uppercase">Contact & Support</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a href="mailto:contact@groceroo.com.au" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium flex items-center">
                  <Mail className="w-4 h-4 mr-2" /> contact@groceroo.com.au
                </a>
              </li>
              <li>
                <a href="tel:+61478477036" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium flex items-center">
                  <Phone className="w-4 h-4 mr-2" /> +61 478 477 036
                </a>
              </li>
              <li>
                <a href="https://wa.me/61478477036" target="_blank" rel="noopener noreferrer" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:col-span-1">
            <h4 className="text-xs font-semibold text-primary mb-2 tracking-wide uppercase">Quick Links</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/contact" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/work" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Work With Us
                </Link>
              </li>
              <li>
                <Link to="/business-delivery" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Business Delivery
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:col-span-1">
            <h4 className="text-xs font-semibold text-primary mb-2 tracking-wide uppercase">More</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link to="/" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors rounded px-3 py-1 text-gray-700 hover:bg-primary/10 hover:text-primary font-medium">
                  Terms and conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-xs text-gray-600">
              &copy; {currentYear} Groceroo. All rights reserved.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <button onClick={clearStorage} className="transition-colors rounded px-2 py-1 hover:bg-red-100 hover:text-red-500 text-xs font-medium">Clear Data</button>
              <Link to="/privacy" className="transition-colors rounded px-2 py-1 hover:bg-primary/10 hover:text-primary font-medium">
                Privacy Policy
              </Link>
              <Link to="/terms" className="transition-colors rounded px-2 py-1 hover:bg-primary/10 hover:text-primary font-medium">
                Terms of Service
              </Link>
            </div>
             <div className="flex items-center space-x-4 text-xs text-gray-600">
                <p className="text-md text-[#25D366] font-semibold">
                  SARITA ❤️
                </p>
              </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;