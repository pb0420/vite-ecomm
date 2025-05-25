import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, ShoppingCart, Bot, MessageSquare as MessageSquareMore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';

const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatBoxRef.current && !chatBoxRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: settings } = await supabase
        .from('openai_settings')
        .select('*')
        .single();

      // Simulate AI response for now
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I can help you find products. What are you looking for?",
          products: []
        }]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/1234567890', '_blank');
  };

  const LoginPrompt = () => (
    <div className="p-4">
      <div className="text-sm text-center text-muted-foreground mb-4">
        By continuing, you agree to our{' '}
        <a href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</a> and{' '}
        <a href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</a>
      </div>
      <PhoneLoginForm onSuccess={() => {}} />
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#2E8B57] hover:bg-[#2E8B57]/90"
        size="icon"
      >
        <MessageSquareMore className="h-6 w-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatBoxRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 w-96 max-h-[calc(100vh-120px)] bg-background border rounded-lg shadow-xl flex flex-col"
          >
            <Tabs defaultValue="ai" className="w-full h-full" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between p-4 border-b">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="ai" className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />AI Chat
                  </TabsTrigger>
                  <TabsTrigger value="human" className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />Human
                  </TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden">
                {user ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
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

                    <form onSubmit={handleSubmit} className="p-4 border-t">
                      <div className="flex space-x-2">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask about products..."
                          disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <LoginPrompt />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="human" className="flex-1">
                <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
                  <MessageCircle className="h-12 w-12 text-[#2E8B57]" />
                  <h3 className="text-lg font-semibold">Chat with our team</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team is available on WhatsApp to assist you with your orders and queries.
                  </p>
                  <Button onClick={openWhatsApp} className="mt-4 bg-[#2E8B57] hover:bg-[#2E8B57]/90">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Open WhatsApp Chat
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatBot;