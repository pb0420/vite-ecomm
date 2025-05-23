
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ShieldAlert } from 'lucide-react'; // Changed LogIn to ShieldAlert for admin

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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">Groceroo</h3>
            <p className="text-sm text-gray-600">
              Express grocery shopping and delivery service. Fresh products delivered to your door.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/categories" className="text-gray-600 hover:text-primary">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-600 hover:text-primary">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?featured=true" className="text-gray-600 hover:text-primary">
                  Featured Items
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-gray-600 hover:text-primary">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/returns" className="text-gray-600 hover:text-primary">
                  Returns Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/login" className="text-gray-600 hover:text-primary">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-primary">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-gray-600 hover:text-primary">
                  Order History
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
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <Link to="/admin-login" className="hover:text-destructive opacity-60 hover:opacity-100 flex items-center" title="Admin Login Portal">
                <ShieldAlert className="w-3 h-3 mr-1" /> Admin Portal
              </Link>
              <button onClick={clearStorage} className="hover:text-red-500 text-xs">Clear Data</button>

              <Link to="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary">
                Terms of Service
              </Link>
              <Link to="/cookies" className="hover:text-primary">
                Cookie Policy
              </Link>
              <button onClick={clearStorage} className="hover:text-red-500 text-xs">
                Clear Storage
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
