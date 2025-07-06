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
  const { user,updateUserInfo } = useAuth();
  const [updateUserChatHistoryFlag,setUpdateUserChatHistoryFlag] = useState(false);
  const [fetchedUserChatHistoryFlag,setFetchedUserChatHistoryFlag] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);


// Capitalize each word and replace + with space
const formatName = str =>
  str.replace(/\+/g, ' ')
     .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));
  
const matchProductFtsStrict = (ftsString, aiName, product) => {
  if (!ftsString) return false;
  const ftsTokens = new Set(
    ftsString
      .split(/\s+/)
      .map(token => token.split(':')[0].replace(/'/g, '').toLowerCase())
  );
  const aiTokens = aiName.replace(/\+/g, ' ').toLowerCase().split(/\s+/);

  // Helper: check if token is in name or description
  const inNameOrDesc = (token) =>
    (product.name && product.name.toLowerCase().includes(token)) ||
    (product.description && product.description.toLowerCase().includes(token));

  // Exclusion map for ambiguous terms (single and multi-word)
  const exclusionMap = {
    ginger: ['beer'],
    garlic: ['chips', 'bread'],
    coffee: ['cake'],
    'olive oil': ['tuna', 'sardines'],
    // Add more as needed
  };

  // For single-word AI names
  if (aiTokens.length === 1) {
    const token = aiTokens[0];
    const ftsMatch = Array.from(ftsTokens).some(ftsToken => ftsToken.startsWith(token));
    const textMatch = inNameOrDesc(token);

    if (ftsMatch || textMatch) {
      if (exclusionMap[token]) {
        for (const ex of exclusionMap[token]) {
          if (
            Array.from(ftsTokens).some(ftsToken => ftsToken.startsWith(ex)) ||
            inNameOrDesc(ex)
          ) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  // For multi-word AI names, require all tokens to be present in FTS or name/desc
  const allTokensPresent = aiTokens.every(token =>
    Array.from(ftsTokens).some(ftsToken => ftsToken.startsWith(token)) ||
    inNameOrDesc(token)
  );
  if (!allTokensPresent) return false;

  // Exclusion logic for ambiguous multi-token terms
  const aiKey = aiTokens.join(' ');
  if (exclusionMap[aiKey]) {
    for (const ex of exclusionMap[aiKey]) {
      if (
        Array.from(ftsTokens).some(ftsToken => ftsToken.startsWith(ex)) ||
        inNameOrDesc(ex)
      ) {
        return false;
      }
    }
  }
  return true;
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  // Fetch chat history on mount
  useEffect(() => {
  if (!user) return;
    getUserAiChat();
  }, [user]);

  useEffect(() => {
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      scrollToBottom();
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };

  }, [isOpen]);

  const getUserAiChat = async () => {
    if (user.ai_chat && Array.isArray(user.ai_chat) && fetchedUserChatHistoryFlag === false){
      if (user.ai_chat.length > 1) {
        setMessages(user.ai_chat.slice(-1));
        setPendingMessages(user.ai_chat.slice(0, -1));
      } else {
        setMessages(user.ai_chat);
        setPendingMessages([]);
      }
      setFetchedUserChatHistoryFlag(true);
    } 
  }

  useEffect(() => {
    let timeout;
    if (isOpen && pendingMessages.length > 0) {
      // Wait for animation to finish (adjust delay as needed)
      timeout = setTimeout(() => {
        setMessages(prev => [...pendingMessages, ...prev]);
        setPendingMessages([]);
      }, 1800); // 400ms matches your animation duration
    }
    return () => clearTimeout(timeout);
  }, [isOpen, pendingMessages]);

useEffect(() => {
  if(updateUserChatHistoryFlag){
    updateUserChatHistory();
  }
},[updateUserChatHistoryFlag])

const updateUserChatHistory = async () => {
  if(user && messages.length){
      // Only save serializable fields
    const serializableMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      groupedProducts: m.groupedProducts || []
    }));
    updateUserInfo({ ai_chat: serializableMessages },false);
  }
  setUpdateUserChatHistoryFlag(false);
}  

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
          productNames = data.products.map(name => name.replace(/\s+/g, '+'));
        } else if (typeof data.products[0] === 'object' && data.products[0]?.name) {
          productNames = data.products.map(p => p.name.replace(/\s+/g, '+'));
        }
      }
      
      if (productNames.length > 0) {
        // Use Supabase full-text search to find products by name
        const searchQuery = productNames
          .map(name => `'${name.replace(/'/g, "''")}'`)
          .join(' | ');
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .eq('in_stock',true)
          .textSearch('fts', `${searchQuery}`);
          if (!error && products) {
            // After fetching products from Supabase
            if (!error && products) {
              
              // Sort AI names by descending word count (most specific first)
              const sortedProductNames = [...productNames].sort((a, b) => b.split('+').length - a.split('+').length);
              
              const aiSuggestions = {};
              productNames.forEach(aiName => { aiSuggestions[aiName] = []; });
              const matchedProductIds = new Set();

              products.forEach(product => {
                // Find the most specific matching aiName
                  const matchIdx = sortedProductNames.findIndex(aiName => matchProductFtsStrict(product.fts, aiName, product));                if (matchIdx !== -1) {
                  const aiName = sortedProductNames[matchIdx];
                  aiSuggestions[aiName].push({id:product.id,name:product.name,price:product.price});
                  matchedProductIds.add(product.id);
                }
              });
            
              const groupedProducts = productNames.map(aiName => ({
                aiName,
                suggestions: aiSuggestions[aiName]
              }));
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: data.message || 'Here are some suggestions:',
                  groupedProducts:groupedProducts
                }
              ]);
              scrollToBottom();
              setUpdateUserChatHistoryFlag(true);
              setIsLoading(false);
              return;
            }
          }
      }
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

  const [expandedSuggestions, setExpandedSuggestions] = useState({});
    const toggleSuggestions = (productId) => {
      setExpandedSuggestions(prev => ({
        ...prev,
        [productId]: !prev[productId]
      }));
    };

  // Define drawer and overlay variants
  const drawerVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 180,
        damping: 24,
        mass: 0.8
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 180,
        damping: 24,
        mass: 0.8
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#3cb371] hover:bg-[#3cb371]/90 z-50"
        size="icon"
      >
        <img src="https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/icon-plain.webp" alt="Groceroo AI" className="h-10 w-10" />
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
              className="fixed top-0 right-0 z-50 w-full max-w-md h-full bg-[#e6f7f1] border-l rounded-l-lg shadow-xl flex flex-col overflow-hidden"
              style={{ maxHeight: '100vh' }}
            >
              {/* WhatsApp Chat Row */}
              <div className="flex items-center justify-between gap-2 p-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                    alt="WhatsApp"
                    className="h-6 w-6"
                    style={{ background: "#25D366", borderRadius: "50%" }}
                  />
                  <span className="text-sm font-medium text-[#25D366]">Chat with a human on WhatsApp</span>
                </div>
                <Button
                  onClick={openWhatsApp}
                  className="h-10 px-4 rounded-lg bg-[#25D366] hover:bg-[#128C7E] flex items-center gap-2 text-white font-semibold"
                  aria-label="Open WhatsApp Chat"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="hidden sm:inline">Open</span>
                </Button>
              </div>

              {/* AI Chat Row */}
              <div className="flex items-center justify-between gap-2 p-4 border-b bg-background">
                <div className="flex items-center gap-2">
                  <Bot className="inline-block h-6 w-6 text-[#3cb371]" />
                  <span className="text-lg font-semibold text-[#2E8B57]">Groceroo AI</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[#e6f7f1] text-xs font-bold text-[#3cb371] border border-[#3cb371]">Beta</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="hover:bg-red-50"
                >
                  <X className="h-5 w-5 text-red-400" />
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
                            {message.groupedProducts && message.groupedProducts.length > 0 && (
                              <div className="mt-2 space-y-4">
                                {message.groupedProducts.map((group, idx) => (
                                  <div key={idx} className="mb-4 bg-white/80 rounded-lg shadow border p-3">
                                    <div className="font-semibold text-[#2E8B57] mb-2 text-base">
                                      - {formatName(group.aiName)}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {(expandedSuggestions[idx] ? group.suggestions : group.suggestions.slice(0, 2)).map(product => (
                                        <div
                                          key={product.id}
                                          className="flex items-center justify-between bg-[#e6f7f1] rounded px-3 py-2 border"
                                        >
                                          <span className="text-sm max-w-[60%] font-medium text-[#2E8B57]">{formatName(product.name)}</span>
                                          <div className="flex items-center gap-2 min-w-[90px] justify-end">
                                            {product.price && (
                                              <span className="text-xs text-gray-700 font-semibold">
                                                ${Number(product.price).toFixed(2)}
                                              </span>
                                            )}
                                            <Button
                                              size="sm"
                                              className="bg-[#2E8B57] hover:bg-[#27694a] text-white px-3 py-1 rounded"
                                              onClick={() => addToCart(product, 1)}
                                            >
                                              <ShoppingCart className="h-4 w-4 mr-1" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    {group.suggestions.length > 2 && (
                                      <Button
                                        variant="link"
                                        size="xs"
                                        className="mt-1 text-xs text-primary"
                                        onClick={() => toggleSuggestions(idx)}
                                      >
                                        {expandedSuggestions[idx] ? 'Show less' : 'Show more'}
                                      </Button>
                                    )}
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
                          className="h-14 text-base"
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
