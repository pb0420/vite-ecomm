// File: groceroo/src/components/chat/AiChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, ShoppingCart, Bot, MessageSquare as MessageSquareMore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Send POST request to the AI API
      const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/googlegenai-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: user.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to get AI response');
      const data = await response.json();
      // data.products is expected to be an array of product names or objects
      let productNames = [];
      if (Array.isArray(data.products)) {
        if (typeof data.products[0] === 'string') {
          productNames = data.products;
        } else if (typeof data.products[0] === 'object' && data.products[0]?.name) {
          productNames = data.products.map(p => p.name);
        }
      }
      let foundProducts = [];
      if (productNames.length > 0) {
        // Use Supabase full-text search to find products by name
        const searchQuery = productNames
          .map(name => `'${name.replace(/'/g, "''")}'`)
          .join(' | ');
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .textSearch('name', searchQuery);
        if (!error && products) {
          foundProducts = products;
        }
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Here are some suggestions:',
        products: foundProducts
      }]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again later.',
        products: []
      }]);
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/1234567890', '_blank'); // Replace with actual WhatsApp number
  };

  const LoginPrompt = () => (
    <div className="p-4">
      <PhoneLoginForm onSuccess={() => {}} />
    </div>
  );

  // Define drawer and overlay variants
  const drawerVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };


  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#2A8A57] hover:bg-[#2E7A57]/90 z-50"
        size="icon"
      >
        <MessageSquareMore className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Drawer */}
            <motion.div
              ref={chatBoxRef}
              initial="closed"
              animate="open"
              exit="closed"
              variants={drawerVariants}
              className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-background border-l rounded-l-lg shadow-xl flex flex-col overflow-hidden"
              style={{ maxHeight: '100vh' }}
            >
              {/* WhatsApp Button at the top */}
              <div className='flex items-center justify-between p-4 border-b bg-background'>
                  <span className="text-sm text-muted-foreground">
                  Chat with a human on WhatsApp!
                </span>
                <Button
                  onClick={openWhatsApp}
                  className="h-12 w-[30%] rounded-lg bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center"
                  size="icon"
                  aria-label="Open WhatsApp Chat"
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border-b bg-background">
                <span className="text-lg font-semibold text-muted-foreground">
                  <Bot className="inline-block mr-2" />
                  AI Chat (beta)
                </span>
                {/* WhatsApp Button */} 
              
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col h-0">
                {user ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-full rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-[#2E8B57] text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.products && message.products.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.products.map((product) => (
                                  <div
                                    key={product.id}
                                    className="flex items-center justify-between bg-background rounded p-2"
                                  >
                                    <span className="text-sm">{product.name}</span>
                                    <Button
                                      size="sm"
                                      onClick={() => addToCart(product, 1)}
                                    >
                                      <ShoppingCart className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              <div className="w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
                      <div className="flex space-x-2">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="I want to cook some Pasta for dinner"
                          disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col h-full overflow-y-auto">
                    <LoginPrompt />
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatBot;
