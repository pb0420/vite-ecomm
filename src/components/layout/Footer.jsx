import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, ShieldAlert, Mail, Phone, MessageCircle } from 'lucide-react';

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
            <div
            style={{
              backgroundImage: 'url(/logo.png)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              // backgroundColor: '#3cb371',
              width: '100px',
              height: '40px',
            }}
            aria-label="Groceroo Logo"
          ></div>
            <div className="text-xs text-gray-500">ABN 257 558 402 06</div>
            <p className="text-sm text-gray-600">
              Express grocery shopping and delivery service in Adelaide. Groceries and more delivered to your door.
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
              <h4 className="text-sm font-semibold">Get in Touch</h4>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <a href="mailto:contact@groceroo.com.au" className="hover:text-primary underline">
                  contact@groceroo.com.au
                </a>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <a href="tel:+61478477036" className="hover:text-primary underline">
                  +61 478 477 036
                </a>
              </div>
              <div className="flex items-center text-gray-600">
                 <MessageCircle className="w-4 h-4 mr-2" />
                <a href="https://wa.me/61478477036" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">
                  Chat on WhatsApp
                </a>
              </div>
            </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">More</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-primary">
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
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <button onClick={clearStorage} className="hover:text-red-500 text-xs">Clear Data</button>

              <Link to="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;