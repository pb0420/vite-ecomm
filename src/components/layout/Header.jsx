import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Package,UserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import LoginDialog from '@/components/auth/LoginDialog';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { getCartCount, toggleCart } = useCart();
  const { user, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();

  const cartCount = getCartCount();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate('/');
  };

  const menuVariants = {
    closed: { opacity: 0, x: '100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    open: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#2E8B57] via-[#3CB371] to-[#98FB98] border-b shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="Groceroo Logo" style={{height: '42px',width:'172px'}} />
        </Link>

        <nav className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/store-pickup" className="text-sm font-medium transition-colors hover:text-white text-white/90">Grocery Run</Link>
          <Link to="/shop" className="text-sm font-medium transition-colors hover:text-white text-white/90">Shop</Link>
          <Link to="/categories" className="text-sm font-medium transition-colors hover:text-white text-white/90">Categories</Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium transition-colors hover:text-white text-white/90">Admin Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative hover:bg-white/20" onClick={toggleCart}>
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] text-xs bg-[#fd7507] hover:bg-[#fd7507]/90 text-white border-0">{cartCount}</Badge>
            )}
          </Button>

          {!loading && (
            user ? (
              <div className="md:flex md:items-center md:space-x-2">
                <Link to="/account">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 hover:bg-white/20 text-white">
                    <UserRound className="w-4 h-4" />
                    <span>{user.name?.split(' ')[0] || 'My Account'}</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" variant="outline" size="sm" onClick={() => setIsLoginOpen(true)}>
                <UserRound /> 
              </Button>
            )
          )}

          {/* <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            <Menu className="w-5 h-5" />
          </Button> */}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
          >
            <motion.div
              className="absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-white shadow-xl"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-lg font-semibold">Menu</span>
                <Button variant="ghost" size="icon" onClick={closeMenu}><X className="w-5 h-5" /></Button>
              </div>

              <div className="flex flex-col p-4 space-y-4">
                <Link to="/" className="flex items-center space-x-2 text-sm" onClick={closeMenu}>Home</Link>
                <Link to="/shop" className="flex items-center space-x-2 text-sm" onClick={closeMenu}>Shop</Link>
                <Link to="/categories" className="flex items-center space-x-2 text-sm" onClick={closeMenu}>Categories</Link>

                {isAdmin && (
                  <Link to="/admin" className="flex items-center space-x-2 text-sm" onClick={closeMenu}>
                    <Package className="w-4 h-4" /><span>Admin Dashboard</span>
                  </Link>
                )}

                {!loading && (
                  user ? (
                    <>
                      <Link to="/account" className="flex items-center space-x-2 text-sm" onClick={closeMenu}>
                        <User className="w-4 h-4" /><span>My Account</span>
                      </Link>
                      <Button variant="ghost" className="flex items-center justify-start space-x-2 text-sm" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /><span>Logout</span>
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => { closeMenu(); setIsLoginOpen(true); }}>Sign In</Button>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </header>
  );
};

export default Header;