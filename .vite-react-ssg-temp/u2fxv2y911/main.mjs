import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, createContext, useContext, useCallback, useRef, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { Link, useNavigate, useLocation, useParams, BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { X, CheckCircle, MessageSquare, ShoppingCart, UserRound, Package, User, LogOut, Facebook, Instagram, Twitter, Mail, Phone, MessageCircle, ShieldAlert, Minus, Plus, Trash2, Bot, Send, MapPinCheckInside, Clock, Store, ArrowRight, Truck, Utensils, Fish, Candy, Beef, Apple, Croissant, Hamburger, Cookie, EggFried, CupSoda, ChevronDown, ChevronUp, Check, Search, ArrowLeft, MapPin, ChevronRight, ChevronLeft, Circle, Calendar as Calendar$1, Tag, CreditCard, XCircle, Edit2, Eye, ShoppingBag, Users, Filter, Image as Image$1, UploadCloud, PlusCircle, Edit, CalendarIcon, List, Settings, Upload, Info, Camera } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { format, addDays } from "date-fns";
import { DayPicker } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as TabsPrimitive from "@radix-ui/react-tabs";
const saveCart = (cart) => {
  localStorage.setItem("groceroo-cart", JSON.stringify(cart));
};
const loadCart = () => {
  const cart = localStorage.getItem("groceroo-cart");
  return cart ? JSON.parse(cart) : [];
};
const TOAST_LIMIT = 1;
let count = 0;
function generateId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}
const toastStore = {
  state: {
    toasts: []
  },
  listeners: [],
  getState: () => toastStore.state,
  setState: (nextState) => {
    if (typeof nextState === "function") {
      toastStore.state = nextState(toastStore.state);
    } else {
      toastStore.state = { ...toastStore.state, ...nextState };
    }
    toastStore.listeners.forEach((listener) => listener(toastStore.state));
  },
  subscribe: (listener) => {
    toastStore.listeners.push(listener);
    return () => {
      toastStore.listeners = toastStore.listeners.filter((l) => l !== listener);
    };
  }
};
const toast$1 = ({ ...props }) => {
  const id = generateId();
  const update = (props2) => toastStore.setState((state) => ({
    ...state,
    toasts: state.toasts.map(
      (t) => t.id === id ? { ...t, ...props2 } : t
    )
  }));
  const dismiss = () => toastStore.setState((state) => ({
    ...state,
    toasts: state.toasts.filter((t) => t.id !== id)
  }));
  toastStore.setState((state) => ({
    ...state,
    toasts: [
      { ...props, id, dismiss },
      ...state.toasts
    ].slice(0, TOAST_LIMIT)
  }));
  return {
    id,
    dismiss,
    update
  };
};
function useToast() {
  const [state, setState] = useState(toastStore.getState());
  useEffect(() => {
    const unsubscribe = toastStore.subscribe((state2) => {
      setState(state2);
    });
    return unsubscribe;
  }, []);
  useEffect(() => {
    const timeouts = [];
    state.toasts.forEach((toast2) => {
      if (toast2.duration === Infinity) {
        return;
      }
      const timeout = setTimeout(() => {
        toast2.dismiss();
      }, toast2.duration || 5e3);
      timeouts.push(timeout);
    });
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [state.toasts]);
  return {
    toast: toast$1,
    toasts: state.toasts
  };
}
const CartContext = createContext();
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  useEffect(() => {
    const savedCart = loadCart();
    if (savedCart && savedCart.length > 0) {
      setCart(savedCart);
    }
  }, []);
  useEffect(() => {
    saveCart(cart);
  }, [cart]);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        const updatedCart = prevCart.map(
          (item) => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
        toast$1({
          title: "Item updated",
          description: `${product.name} quantity updated in your cart.`,
          duration: 2e3
        });
        return updatedCart;
      } else {
        toast$1({
          title: "Item added",
          description: `${product.name} added to your cart.`,
          duration: 2e3
        });
        return [...prevCart, { ...product, quantity }];
      }
    });
  };
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const itemToRemove = prevCart.find((item) => item.id === productId);
      if (itemToRemove) {
        toast$1({
          title: "Item removed",
          description: `${itemToRemove.name} removed from your cart.`,
          duration: 2e3
        });
      }
      return prevCart.filter((item) => item.id !== productId);
    });
  };
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      (prevCart) => prevCart.map(
        (item) => item.id === productId ? { ...item, quantity } : item
      )
    );
  };
  const clearCart = () => {
    setCart([]);
    toast$1({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
      duration: 2e3
    });
  };
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const getCartCount = () => {
    return cart.reduce((count2, item) => count2 + item.quantity, 0);
  };
  return /* @__PURE__ */ jsx(CartContext.Provider, { value: {
    cart,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount
  }, children });
};
const supabaseUrl = "https://bcbxcnxutotjzmdjeyde.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const OrderContext = createContext();
const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};
const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const addOrder = async (orderInput) => {
    try {
      const { data, error } = await supabase.from("orders").insert({
        user_id: orderInput.user_id || null,
        customer_name: orderInput.customer_name,
        customer_email: orderInput.customer_email,
        customer_phone: orderInput.customer_phone,
        customer_address: orderInput.customer_address,
        customer_postcode: orderInput.customer_postcode,
        delivery_notes: orderInput.delivery_notes,
        total: orderInput.total,
        status: "pending",
        delivery_type: orderInput.delivery_type,
        scheduled_delivery_time: orderInput.scheduled_delivery_time,
        delivery_fee: orderInput.delivery_fee,
        items: orderInput.items,
        payment_data: orderInput.payment_data
      }).select().single();
      if (error) throw error;
      toast$1({
        title: "Order Created",
        description: "Your order has been successfully placed."
      });
      return data;
    } catch (error) {
      console.error("Error creating order:", error);
      toast$1({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order. Please try again."
      });
      throw error;
    }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      toast$1({
        title: "Order Updated",
        description: `Order status changed to ${status}.`
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast$1({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status."
      });
    }
  };
  const getOrderById = async (orderId) => {
    try {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  };
  const getOrdersByStatus = async (status) => {
    try {
      let query = supabase.from("orders").select("*");
      if (status) {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };
  return /* @__PURE__ */ jsx(OrderContext.Provider, { value: {
    orders,
    addOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByStatus
  }, children });
};
const AuthContext = createContext();
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setIsAdmin(false);
      return null;
    }
    try {
      const { data, error, status } = await supabase.from("profiles").select(`name, phone, address, is_admin, addresses`).eq("id", userId).single();
      if (error && status !== 406) {
        console.error("Error fetching user profile (status not 406):", error.message);
        throw error;
      }
      if (error && status === 406) {
        console.warn("Profile not found or no permission (406), this might be expected for new users before profile creation or RLS issues.");
        setProfile(null);
        setIsAdmin(false);
        return null;
      }
      if (data) {
        console.log(data);
        const phoneNumber = data.phone;
        data.phone = phoneNumber.startsWith("61") ? `0${phoneNumber.replace(/^61/, "")}` : phoneNumber;
        setProfile(data);
        setIsAdmin(data.is_admin === true);
        return data;
      } else {
        setProfile(null);
        setIsAdmin(false);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile (catch block):", error.message);
      if (error.message !== "JSON object requested, multiple (or no) rows returned") {
        toast$1({ variant: "destructive", title: "Profile Error", description: "Could not load user profile. " + error.message });
      }
      setProfile(null);
      setIsAdmin(false);
      return null;
    }
  }, []);
  useEffect(() => {
    let isMounted = true;
    const handleAuthStateChange = async (session) => {
      if (!isMounted) return;
      console.log("Handling auth state change:", session);
      if (session == null ? void 0 : session.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        setIsAdmin((userProfile == null ? void 0 : userProfile.is_admin) === true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleAuthStateChange(session);
      }
    );
    const initializeSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (isMounted) {
        if (sessionError) {
          console.error("Error fetching initial session:", sessionError);
          toast$1({ variant: "destructive", title: "Auth Error", description: "Could not fetch initial session." });
          setUser(null);
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        } else {
          handleAuthStateChange(session);
        }
      }
    };
    initializeSession();
    return () => {
      isMounted = false;
      subscription == null ? void 0 : subscription.unsubscribe();
    };
  }, [fetchProfile]);
  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error);
      toast$1({ variant: "destructive", title: "Login Failed", description: error.message });
      setLoading(false);
      return { success: false, isAdminUser: false, error: error.message };
    }
    const userProfile = await fetchProfile(data.user.id);
    return { success: true, isAdminUser: (userProfile == null ? void 0 : userProfile.is_admin) === true };
  };
  const register = async (email, password, name, phone) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    if (error) {
      console.error("Registration error:", error);
      toast$1({ variant: "destructive", title: "Registration Failed", description: error.message });
      setLoading(false);
      return false;
    }
    if (data.user && phone) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      const { error: profileError } = await supabase.from("profiles").update({ phone, updated_at: /* @__PURE__ */ new Date() }).eq("id", data.user.id);
      if (profileError) {
        console.error("Error updating phone during registration:", profileError);
        toast$1({ variant: "destructive", title: "Profile Update Issue", description: "Could not save phone number: " + profileError.message });
      }
    }
    toast$1({ title: "Registration Successful", description: "Please check your email to confirm your account." });
    return true;
  };
  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      toast$1({ variant: "destructive", title: "Logout Failed", description: error.message });
      setLoading(false);
    } else {
      toast$1({ title: "Logged Out", description: "You have been successfully logged out." });
    }
  };
  const updateUserInfo = async (newUserData) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("profiles").update({
      name: newUserData.name,
      phone: newUserData.phone,
      address: newUserData.address,
      addresses: newUserData.addresses,
      updated_at: /* @__PURE__ */ new Date()
    }).eq("id", user.id).select().single();
    if (error) {
      console.error("Profile update error:", error);
      toast$1({ variant: "destructive", title: "Update Failed", description: error.message });
    } else if (data) {
      setProfile(data);
      setIsAdmin(data.is_admin === true);
      toast$1({ title: "Profile Updated", description: "Your information has been updated." });
    }
    setLoading(false);
  };
  const combinedUser = user && profile ? { ...user, ...profile, email: user.email } : user;
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: {
    user: combinedUser,
    session: supabase.auth.getSession(),
    // Keep this to allow components to access session if needed
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateUserInfo
  }, children });
};
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2
  }).format(amount);
}
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      className: cn(buttonVariants({ variant, size, className })),
      ref,
      ...props
    }
  );
});
Button.displayName = "Button";
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Input.displayName = "Input";
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = LabelPrimitive.Root.displayName;
const PhoneLoginForm = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1e3);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast$1({ variant: "destructive", title: "Error", description: "Please enter a phone number" });
      return;
    }
    const formattedNumber = phoneNumber.startsWith("+61") ? phoneNumber : `+61${phoneNumber.replace(/^0/, "")}`;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedNumber
      });
      if (error) throw error;
      setCodeSent(true);
      setCountdown(30);
      toast$1({ title: "Code Sent", description: "Please check your phone for the verification code." });
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast$1({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast$1({ variant: "destructive", title: "Error", description: "Please enter a valid 6-digit code" });
      return;
    }
    setLoading(true);
    try {
      const formattedNumber = phoneNumber.startsWith("+61") ? phoneNumber : `+61${phoneNumber.replace(/^0/, "")}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedNumber,
        token: otp,
        type: "sms"
      });
      if (error) throw error;
      toast$1({ title: "Success", description: "You have been successfully logged in." });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast$1({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "w-full max-w-lg mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 shadow-lg", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: "Welcome to Groceroo" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm", children: "Enter your phone number to get started" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: codeSent ? handleVerifyOtp : handleSendOtp, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "phone", className: "text-sm font-semibold text-gray-700", children: "Phone Number" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsx("span", { className: "text-gray-500 text-sm font-medium", children: "+61" }) }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "phone",
              type: "tel",
              placeholder: "04XXXXXXXX",
              value: phoneNumber.replace(/^\+61/, ""),
              onChange: (e) => setPhoneNumber(e.target.value),
              disabled: loading || codeSent,
              className: "pl-10 h-10 text-base border-2 focus:border-primary transition-colors"
            }
          )
        ] })
      ] }),
      codeSent && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "otp", className: "text-sm font-semibold text-gray-700", children: "Verification Code" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "otp",
              type: "text",
              maxLength: 6,
              placeholder: "Enter 6-digit code",
              value: otp,
              onChange: (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)),
              disabled: loading,
              className: "h-10 text-base text-center tracking-widest border-2 focus:border-primary transition-colors"
            }
          ),
          otp.length === 6 && /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: !codeSent ? /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors",
          disabled: loading || !phoneNumber.trim(),
          children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }),
            "Sending Code..."
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "w-4 h-4 mr-2" }),
            "Send Verification Code"
          ] })
        }
      ) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors",
            disabled: loading || otp.length !== 6,
            children: loading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }),
              "Verifying..."
            ] }) : "Verify & Sign In"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            className: "w-full h-8 text-sm",
            onClick: handleSendOtp,
            disabled: loading || countdown > 0,
            children: countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 pt-4 border-t border-gray-200", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-center text-gray-500 leading-relaxed", children: [
      "By continuing, you agree to our",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-primary hover:underline font-medium", target: "_blank", children: "Terms of Service" }),
      " ",
      "and",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-primary hover:underline font-medium", target: "_blank", children: "Privacy Policy" })
    ] }) })
  ] }) });
};
const LoginDialog = ({ open, onOpenChange }) => {
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: /* @__PURE__ */ jsx("h1", {}) }) }),
    /* @__PURE__ */ jsx(PhoneLoginForm, { onSuccess: () => onOpenChange(false) })
  ] }) });
};
const Header = () => {
  var _a;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { getCartCount, toggleCart } = useCart();
  const { user, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const cartCount = getCartCount();
  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = async () => {
    await logout();
    closeMenu();
    navigate("/");
  };
  const menuVariants = {
    closed: { opacity: 0, x: "100%", transition: { type: "spring", stiffness: 300, damping: 30 } },
    open: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }
  };
  return /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-40 w-full bg-gradient-to-r from-[#2E8B57] via-[#3CB371] to-[#98D598] border-b shadow-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "container flex items-center justify-between h-16 px-4 mx-auto md:px-6", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center space-x-2", children: /* @__PURE__ */ jsx(
        "div",
        {
          style: {
            backgroundImage: "url(/logo.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            width: "180px",
            height: "60px"
          },
          "aria-label": "Groceroo Logo"
        }
      ) }),
      /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex md:items-center md:space-x-6", children: [
        /* @__PURE__ */ jsx(Link, { to: "/store-pickup", className: "text-sm font-medium transition-colors hover:text-white text-white/90", children: "Grocery Run" }),
        /* @__PURE__ */ jsx(Link, { to: "/shop", className: "text-sm font-medium transition-colors hover:text-white text-white/90", children: "Shop" }),
        /* @__PURE__ */ jsx(Link, { to: "/categories", className: "text-sm font-medium transition-colors hover:text-white text-white/90", children: "Categories" }),
        isAdmin && /* @__PURE__ */ jsx(Link, { to: "/admin", className: "text-sm font-medium transition-colors hover:text-white text-white/90", children: "Admin Dashboard" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "icon", className: "relative hover:bg-white/20", onClick: toggleCart, children: [
          /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5 text-white" }),
          cartCount > 0 && /* @__PURE__ */ jsx(Badge, { variant: "default", className: "absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[1.25rem] text-xs bg-[#fd7507] hover:bg-[#fd7507]/90 text-white border-0", children: cartCount })
        ] }),
        !loading && (user ? /* @__PURE__ */ jsx("div", { className: "md:flex md:items-center md:space-x-2", children: /* @__PURE__ */ jsx(Link, { to: "/account", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "flex items-center space-x-1 hover:bg-white/20 text-white", children: [
          /* @__PURE__ */ jsx(UserRound, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { children: ((_a = user.name) == null ? void 0 : _a.split(" ")[0]) || "My Account" })
        ] }) }) }) : /* @__PURE__ */ jsx(Button, { className: "bg-white/20 hover:bg-white/30 text-white border-white/30", variant: "outline", size: "sm", onClick: () => setIsLoginOpen(true), children: /* @__PURE__ */ jsx(UserRound, {}) }))
      ] })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: isMenuOpen && /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "fixed inset-0 z-50 bg-black/50 md:hidden",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: closeMenu,
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            className: "absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-white shadow-xl",
            variants: menuVariants,
            initial: "closed",
            animate: "open",
            exit: "closed",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold", children: "Menu" }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: closeMenu, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col p-4 space-y-4", children: [
                /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center space-x-2 text-sm", onClick: closeMenu, children: "Home" }),
                /* @__PURE__ */ jsx(Link, { to: "/shop", className: "flex items-center space-x-2 text-sm", onClick: closeMenu, children: "Shop" }),
                /* @__PURE__ */ jsx(Link, { to: "/categories", className: "flex items-center space-x-2 text-sm", onClick: closeMenu, children: "Categories" }),
                isAdmin && /* @__PURE__ */ jsxs(Link, { to: "/admin", className: "flex items-center space-x-2 text-sm", onClick: closeMenu, children: [
                  /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Admin Dashboard" })
                ] }),
                !loading && (user ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs(Link, { to: "/account", className: "flex items-center space-x-2 text-sm", onClick: closeMenu, children: [
                    /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsx("span", { children: "My Account" })
                  ] }),
                  /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "flex items-center justify-start space-x-2 text-sm", onClick: handleLogout, children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsx("span", { children: "Logout" })
                  ] })
                ] }) : /* @__PURE__ */ jsx(Button, { onClick: () => {
                  closeMenu();
                  setIsLoginOpen(true);
                }, children: "Sign In" }))
              ] })
            ]
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx(LoginDialog, { open: isLoginOpen, onOpenChange: setIsLoginOpen })
  ] });
};
const Footer = () => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const clearStorage = () => {
    if (window.confirm("Are you sure you want to clear local storage, session storage, and cookies?")) {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + (/* @__PURE__ */ new Date()).toUTCString() + ";path=/");
      });
      window.location.reload();
    }
  };
  return /* @__PURE__ */ jsx("footer", { className: "bg-white border-t", children: /* @__PURE__ */ jsxs("div", { className: "container px-4 py-12 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              backgroundImage: "url(/logo.png)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundColor: "#2E8B57",
              width: "100px",
              height: "40px"
            },
            "aria-label": "Groceroo Logo"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: "ABN 257 558 402 06" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600", children: "Express grocery shopping and delivery service in Adelaide. Groceries and more delivered to your door." }),
        /* @__PURE__ */ jsxs("div", { className: "flex space-x-4", children: [
          /* @__PURE__ */ jsx("a", { href: "#", className: "text-gray-500 hover:text-primary", children: /* @__PURE__ */ jsx(Facebook, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "text-gray-500 hover:text-primary", children: /* @__PURE__ */ jsx(Instagram, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsx("a", { href: "#", className: "text-gray-500 hover:text-primary", children: /* @__PURE__ */ jsx(Twitter, { className: "w-5 h-5" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-600", children: [
            /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx("a", { href: "mailto:contact@groceroo.com.au", className: "hover:text-primary underline", children: "contact@groceroo.com.au" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-600", children: [
            /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx("a", { href: "tel:+61478477036", className: "hover:text-primary underline", children: "+61 478 477 036" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-gray-600", children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-4 h-4 mr-2" }),
            /* @__PURE__ */ jsx("a", { href: "https://wa.me/61478477036", target: "_blank", rel: "noopener noreferrer", className: "hover:text-primary underline", children: "Chat on WhatsApp" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold", children: "Shop" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/categories", className: "text-gray-600 hover:text-primary", children: "Categories" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/shop", className: "text-gray-600 hover:text-primary", children: "All Products" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/shop?featured=true", className: "text-gray-600 hover:text-primary", children: "Featured Items" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold", children: "Connect" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/contact", className: "text-gray-600 hover:text-primary", children: "Contact Us" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/work", className: "text-gray-600 hover:text-primary", children: "Work With Us" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold", children: "More" }),
        /* @__PURE__ */ jsxs("ul", { className: "space-y-2 text-sm", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/", className: "text-gray-600 hover:text-primary", children: "Home" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-gray-600 hover:text-primary", children: "Privacy Policy" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-gray-600 hover:text-primary", children: "Terms and conditions" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "pt-8 mt-8 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-600", children: [
        "© ",
        currentYear,
        " Groceroo. All rights reserved."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-600", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/admin-login", className: "hover:text-destructive opacity-60 hover:opacity-100 flex items-center", title: "Admin Login Portal", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "w-3 h-3 mr-1" }),
          " Admin Portal"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: clearStorage, className: "hover:text-red-500 text-xs", children: "Clear Data" }),
        /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "hover:text-primary", children: "Privacy Policy" }),
        /* @__PURE__ */ jsx(Link, { to: "/terms", className: "hover:text-primary", children: "Terms of Service" })
      ] })
    ] }) })
  ] }) });
};
const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    clearCart
  } = useCart();
  const navigate = useNavigate();
  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };
  const drawerVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };
  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };
  return /* @__PURE__ */ jsx(AnimatePresence, { children: isCartOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      motion.div,
      {
        className: "fixed inset-0 z-50 bg-black/50",
        initial: "closed",
        animate: "open",
        exit: "closed",
        variants: overlayVariants,
        onClick: closeCart
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        className: "fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col",
        initial: "closed",
        animate: "open",
        exit: "closed",
        variants: drawerVariants,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5 text-primary" }),
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: "Your Cart" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
                "(",
                cart.reduce((total, item) => total + item.quantity, 0),
                " items)"
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: closeCart, children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
          ] }),
          cart.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center flex-1 p-8 space-y-4 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "p-4 rounded-full bg-muted", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "w-8 h-8 text-muted-foreground" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "Your cart is empty" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Looks like you haven't added any products to your cart yet." }),
            /* @__PURE__ */ jsx(Button, { onClick: () => {
              closeCart();
              navigate("/shop");
            }, children: "Continue Shopping" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 p-4 overflow-y-auto", children: /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: /* @__PURE__ */ jsx(AnimatePresence, { children: cart.map((item) => /* @__PURE__ */ jsxs(
              motion.li,
              {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
                transition: { duration: 0.2 },
                className: "flex items-center space-x-4 p-3 rounded-lg border bg-card",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      alt: item.name,
                      className: "w-full h-full object-cover",
                      src: item.image_url || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg"
                    }
                  ) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium truncate", children: item.name }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                      formatCurrency(item.price),
                      " / ",
                      item.unit
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center mt-2 space-x-2", children: [
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          variant: "outline",
                          size: "icon",
                          className: "h-7 w-7",
                          onClick: () => updateQuantity(item.id, item.quantity - 1),
                          children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" })
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "text-sm w-8 text-center", children: item.quantity }),
                      /* @__PURE__ */ jsx(
                        Button,
                        {
                          variant: "outline",
                          size: "icon",
                          className: "h-7 w-7",
                          onClick: () => updateQuantity(item.id, item.quantity + 1),
                          children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end space-y-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency(item.price * item.quantity) }),
                    /* @__PURE__ */ jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        className: "h-7 w-7 text-muted-foreground hover:text-destructive",
                        onClick: () => removeFromCart(item.id),
                        children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                      }
                    )
                  ] })
                ]
              },
              item.id
            )) }) }) }),
            /* @__PURE__ */ jsx("div", { className: "p-4 border-t bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: formatCurrency(getCartTotal()) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Shipping" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Calculated at checkout" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-4 border-t", children: [
                /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: "Total" }),
                /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: formatCurrency(getCartTotal()) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    className: "w-full",
                    onClick: clearCart,
                    children: "Clear Cart"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    className: "w-full",
                    onClick: handleCheckout,
                    disabled: cart.length === 0,
                    children: "Checkout"
                  }
                )
              ] })
            ] }) })
          ] })
        ]
      }
    )
  ] }) });
};
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "data-[swipe=move]:transition-none group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full",
  {
    variants: {
      variant: {
        default: "bg-background border",
        destructive: "group destructive border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    ToastPrimitives.Root,
    {
      ref,
      className: cn(toastVariants({ variant }), className),
      ...props
    }
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-destructive/30 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Title,
  {
    ref,
    className: cn("text-sm font-semibold", className),
    ...props
  }
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Description,
  {
    ref,
    className: cn("text-sm opacity-90", className),
    ...props
  }
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(({ id, title, description, action, ...props }) => {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const stripePromise = loadStripe("pk_test_51RU0DpAcyZwL9ZCroHLDNCalx80u736eoFCb3mNARKz2BpDuDhl2VgtPJWp8t0jkaitH7zXOFDiE7B3q95rNColr00V7gqABTc", {
  stripeAccount: "acct_1RU0DpAcyZwL9ZCr"
});
const CheckoutForm$1 = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required"
      });
      if (error) {
        throw new Error(error.message);
      }
      const response = await fetch("https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/verify-stripe-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY"
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id
        })
      });
      const result = await response.json();
      if (result.success) {
        await onPaymentSuccess(result.orderData);
        toast$1({ title: "Payment Successful", description: "Your order has been placed successfully." });
      } else {
        throw new Error(result.error || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast$1({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsx(PaymentElement, {}),
    /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Processing..." : "Pay Now" })
  ] });
};
const StripeCheckoutForm = ({ clientSecret, onPaymentSuccess }) => {
  if (!clientSecret) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    Elements,
    {
      stripe: stripePromise,
      options: {
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2E8B57"
          }
        }
      },
      children: /* @__PURE__ */ jsx(CheckoutForm$1, { onPaymentSuccess })
    }
  );
};
const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, cart } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const handleQuantityChange = (e, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, newQuantity);
  };
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: `product-card overflow-hidden rounded-lg border bg-card ${!product.in_stock ? "opacity-60" : ""}`,
      children: /* @__PURE__ */ jsxs(Link, { to: `/product/${product.id}`, className: "block", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative aspect-square w-full max-h-48 bg-muted", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              alt: product.name,
              className: "w-full h-full object-cover",
              src: product.image_url || "https://images.unsplash.com/photo-1554702299-1ac5541cd63b"
            }
          ),
          product.featured && /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "default",
              className: "absolute top-2 left-2 text-xs",
              children: "Featured"
            }
          ),
          !product.in_stock && /* @__PURE__ */ jsx(
            Badge,
            {
              variant: "destructive",
              className: "absolute top-2 right-2 text-xs",
              children: "Out of Stock"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium truncate", children: product.name }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: formatCurrency(product.price) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "per ",
                product.unit
              ] })
            ] }),
            product.in_stock ? quantity > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1", onClick: (e) => e.preventDefault(), children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  variant: "outline",
                  className: "h-6 w-6",
                  onClick: (e) => handleQuantityChange(e, quantity - 1),
                  children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" })
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-medium w-4 text-center", children: quantity }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "icon",
                  className: "h-6 w-6",
                  onClick: (e) => handleQuantityChange(e, quantity + 1),
                  children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" })
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              Button,
              {
                size: "icon",
                className: "h-7 w-7 rounded-full",
                onClick: handleAddToCart,
                children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-3 w-3" })
              }
            ) : /* @__PURE__ */ jsx(
              Button,
              {
                size: "icon",
                className: "h-7 w-7 rounded-full",
                disabled: true,
                children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-3 w-3" })
              }
            )
          ] })
        ] })
      ] })
    }
  );
};
const AiChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBoxRef = useRef(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const scrollToBottom = () => {
    var _a;
    (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSubmit = async (e) => {
    var _a;
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await fetch("https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/googlegenai-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY"
        },
        body: JSON.stringify({
          message: userMessage,
          user_id: user.id
        })
      });
      if (!response.ok) throw new Error("Failed to get AI response");
      const data = await response.json();
      let productNames = [];
      if (Array.isArray(data.products)) {
        if (typeof data.products[0] === "string") {
          productNames = data.products;
        } else if (typeof data.products[0] === "object" && ((_a = data.products[0]) == null ? void 0 : _a.name)) {
          productNames = data.products.map((p) => p.name);
        }
      }
      let foundProducts = [];
      if (productNames.length > 0) {
        const searchQuery = productNames.map((name) => `'${name.replace(/'/g, "''")}'`).join(" | ");
        const { data: products, error } = await supabase.from("products").select("*").textSearch("name", searchQuery);
        if (!error && products) {
          foundProducts = products;
        }
      }
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.message || "Here are some suggestions:",
        products: foundProducts
      }]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again later.",
        products: []
      }]);
      setIsLoading(false);
    }
  };
  const openWhatsApp = () => {
    window.open("https://wa.me/1234567890", "_blank");
  };
  const LoginPrompt = () => /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-center text-muted-foreground mb-4", children: [
      "By continuing, you agree to our",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/privacy", target: "_blank", className: "text-primary hover:underline", children: "Privacy Policy" }),
      " and",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/terms", target: "_blank", className: "text-primary hover:underline", children: "Terms of Service" })
    ] }),
    /* @__PURE__ */ jsx(PhoneLoginForm, { onSuccess: () => {
    } })
  ] });
  const drawerVariants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };
  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Button,
      {
        onClick: () => setIsOpen(!isOpen),
        className: "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#2A8A57] hover:bg-[#2E7A57]/90 z-50",
        size: "icon",
        children: /* @__PURE__ */ jsx(MessageSquare, { className: "h-6 w-6" })
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: isOpen && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "fixed inset-0 z-40 bg-black/50",
          initial: "closed",
          animate: "open",
          exit: "closed",
          variants: overlayVariants,
          onClick: () => setIsOpen(false)
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          ref: chatBoxRef,
          initial: "closed",
          animate: "open",
          exit: "closed",
          variants: drawerVariants,
          className: "fixed top-0 right-0 z-50 w-full max-w-md h-full bg-background border-l rounded-l-lg shadow-xl flex flex-col overflow-hidden",
          style: { maxHeight: "100vh" },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-background", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "Chat with a human on WhatsApp!" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: openWhatsApp,
                  className: "h-12 w-[30%] rounded-lg bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center",
                  size: "icon",
                  "aria-label": "Open WhatsApp Chat",
                  children: /* @__PURE__ */ jsx(MessageCircle, { className: "h-6 w-6 text-white" })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-background", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-lg font-semibold text-muted-foreground", children: [
                /* @__PURE__ */ jsx(Bot, { className: "inline-block mr-2" }),
                "AI Chat (beta)"
              ] }),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsOpen(false), children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col h-0", children: user ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
                messages.map((message, index) => /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
                    children: /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: `max-w-full rounded-lg p-3 ${message.role === "user" ? "bg-[#2E8B57] text-white" : "bg-muted"}`,
                        children: [
                          /* @__PURE__ */ jsx("p", { className: "text-sm", children: message.content }),
                          message.products && message.products.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: message.products.map((product) => /* @__PURE__ */ jsxs(
                            "div",
                            {
                              className: "flex items-center justify-between bg-background rounded p-2",
                              children: [
                                /* @__PURE__ */ jsx("span", { className: "text-sm", children: product.name }),
                                /* @__PURE__ */ jsx(
                                  Button,
                                  {
                                    size: "sm",
                                    onClick: () => addToCart(product, 1),
                                    children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4" })
                                  }
                                )
                              ]
                            },
                            product.id
                          )) })
                        ]
                      }
                    )
                  },
                  index
                )),
                isLoading && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsx("div", { className: "bg-muted rounded-lg p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce" }),
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce", style: { animationDelay: "0.2s" } }),
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-[#2E8B57] rounded-full animate-bounce", style: { animationDelay: "0.4s" } })
                ] }) }) }),
                /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
              ] }),
              /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "p-4 border-t bg-background", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    value: input,
                    onChange: (e) => setInput(e.target.value),
                    placeholder: "I want to cook some Pasta for dinner",
                    disabled: isLoading
                  }
                ),
                /* @__PURE__ */ jsx(Button, { type: "submit", size: "icon", disabled: isLoading, children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" }) })
              ] }) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col h-full overflow-y-auto", children: /* @__PURE__ */ jsx(LoginPrompt, {}) }) })
          ]
        }
      )
    ] }) })
  ] });
};
function setQueryCache(key, data, ttlMinutes = 30) {
  const expires = Date.now() + ttlMinutes * 60 * 1e3;
  const value = { data, expires };
  localStorage.setItem(key, JSON.stringify(value));
}
function getQueryCache(key) {
  const value = localStorage.getItem(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed.expires && parsed.expires > Date.now()) {
      return parsed.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
const HomePage = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [previouslyOrderedProducts, setPreviouslyOrderedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(45);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      try {
        let productsData = getQueryCache("featuredProducts");
        let categoriesData = getQueryCache("categories_home");
        let deliverySettings = getQueryCache("deliverySettings");
        if (!productsData) {
          const { data, error } = await supabase.from("products").select(`*, categories ( id, name )`).eq("featured", true).limit(20);
          if (error) throw error;
          productsData = data || [];
          setQueryCache("featuredProducts", productsData);
        }
        if (!categoriesData) {
          const { data, error } = await supabase.from("categories").select("*").order("name").limit(7);
          if (error) throw error;
          categoriesData = data || [];
          setQueryCache("categories_home", categoriesData);
        }
        if (!deliverySettings) {
          const { data, error } = await supabase.from("delivery_settings").select("estimated_delivery_minutes").eq("id", 1).single();
          if (!error && data) {
            deliverySettings = data;
            setQueryCache("deliverySettings", deliverySettings);
          }
        }
        setFeaturedProducts(productsData);
        setCategories(categoriesData);
        if (deliverySettings) setDeliveryTime(deliverySettings.estimated_delivery_minutes);
        if (user) {
          await fetchPreviouslyOrderedProducts();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);
  const fetchPreviouslyOrderedProducts = async () => {
    try {
      let previousProducts = getQueryCache(`previouslyOrderedProducts_${user == null ? void 0 : user.id}`);
      if (!previousProducts) {
        const { data: orders, error: ordersError } = await supabase.from("orders").select("items").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5);
        if (ordersError) throw ordersError;
        if (orders && orders.length > 0) {
          const productIds = /* @__PURE__ */ new Set();
          orders.forEach((order) => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item) => {
                if (item.id) productIds.add(item.id);
              });
            }
          });
          if (productIds.size > 0) {
            const { data, error } = await supabase.from("products").select(`*, categories ( id, name )`).in("id", Array.from(productIds)).limit(12);
            if (!error && data) {
              previousProducts = data;
              setQueryCache(`previouslyOrderedProducts_${user.id}`, previousProducts);
            }
          }
        }
      }
      if (previousProducts) setPreviouslyOrderedProducts(previousProducts);
    } catch (error) {
      console.error("Error fetching previously ordered products:", error);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/shop");
    }
  };
  const iconClass = "w-5 h-5 text-primary";
  const getCatIcon = (cName) => {
    switch (cName.toLowerCase()) {
      case "beverages":
      case "soda":
      case "drinks":
        return /* @__PURE__ */ jsx(CupSoda, { className: iconClass });
      case "dairy & eggs":
        return /* @__PURE__ */ jsx(EggFried, { className: iconClass });
      case "cookies":
      case "biscuits":
        return /* @__PURE__ */ jsx(Cookie, { className: iconClass });
      case "burgers":
      case "fast food":
        return /* @__PURE__ */ jsx(Hamburger, { className: iconClass });
      case "bakery":
        return /* @__PURE__ */ jsx(Croissant, { className: iconClass });
      case "fruits":
        return /* @__PURE__ */ jsx(Apple, { className: iconClass });
      case "meat":
        return /* @__PURE__ */ jsx(Beef, { className: iconClass });
      case "confectionary":
      case "candy":
        return /* @__PURE__ */ jsx(Candy, { className: iconClass });
      case "seafood":
        return /* @__PURE__ */ jsx(Fish, { className: iconClass });
      case "kitchen":
        return /* @__PURE__ */ jsx(Utensils, { className: iconClass });
      default:
        return /* @__PURE__ */ jsx(Clock, { className: iconClass });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative min-h-[350px] h-[40vh] max-h-[500px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/banner_bg.jpeg",
            alt: "Grocery delivery",
            className: "w-full h-full object-cover opacity-30"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "container relative h-full px-4 md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-center h-full max-w-4xl mx-auto py-4 md:py-6", children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "space-y-3 md:space-y-4",
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6 },
          children: [
            /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2",
                initial: { scale: 0.8, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                transition: { delay: 0.2, duration: 0.4 },
                children: /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg w-fit", children: [
                  /* @__PURE__ */ jsx(MapPinCheckInside, { className: "w-3 h-3 text-[#fd7507] mr-1.5" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[#2E8B57] font-semibold text-xs", children: "Adelaide   " }),
                  "  ",
                  /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3 text-[#2E8B57] mr-1.5" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[#2E8B57] font-small text-xs", children: [
                    deliveryTime,
                    "m"
                  ] })
                ] })
              }
            ),
            /* @__PURE__ */ jsxs(
              motion.form,
              {
                onSubmit: handleSearch,
                className: "flex gap-1 w-full",
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.4, duration: 0.5 },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "text",
                      placeholder: "Search for groceries and more...",
                      value: searchQuery,
                      onChange: (e) => setSearchQuery(e.target.value),
                      className: "h-10 md:h-12 pl-3 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500 text-sm"
                    }
                  ) }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      type: "submit",
                      size: "sm",
                      className: "h-10 md:h-12 bg-white hover:bg-white/90 shadow-lg text-sm",
                      children: /* @__PURE__ */ jsx(Store, { style: { color: "orange" }, className: "w-8 h-6" })
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.6, duration: 0.5 },
                className: "relative",
                children: /* @__PURE__ */ jsxs("div", { className: "flex overflow-x-auto pb-1 space-x-6 scrollbar-hide px-4 md:px-0 md:justify-center", children: [
                  categories.map((category) => /* @__PURE__ */ jsxs(
                    Link,
                    {
                      to: `/category/${category.id}`,
                      className: "flex-none group text-center",
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg", children: [
                          /* @__PURE__ */ jsx(
                            "img",
                            {
                              src: category.icon_url,
                              alt: category.name,
                              className: "w-12 h-12 md:w-14 md:h-14 object-cover rounded-full",
                              onError: (e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }
                            }
                          ),
                          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 md:w-14 md:h-14 hidden items-center justify-center", children: getCatIcon(category.name) })
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[60px] md:max-w-[75px]", children: category.name })
                      ]
                    },
                    category.id
                  )),
                  /* @__PURE__ */ jsxs(Link, { to: "/categories", className: "flex-none group text-center", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-6 w-6 md:h-8 md:w-8 text-white" }) }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[60px] md:max-w-[75px]", children: "View All" })
                  ] })
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "pt-2 flex justify-center",
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.8, duration: 0.5 },
                children: /* @__PURE__ */ jsx(Link, { to: "/store-pickup", className: "block w-full max-w-md", children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    size: "lg",
                    variant: "outline",
                    className: "w-full h-10 md:h-12 bg-white/95 hover:bg-white border-2 border-white/50 shadow-lg text-[#2E8B57] hover:text-[#2E8B57] font-bold text-sm mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105",
                    children: [
                      "...",
                      /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4 mr-2" }),
                      "Schedule Grocery Run"
                    ]
                  }
                ) })
              }
            )
          ]
        }
      ) }) })
    ] }),
    user && previouslyOrderedProducts.length > 0 && /* @__PURE__ */ jsx("section", { className: "py-8 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "container px-4 md:px-6", children: [
      /* @__PURE__ */ jsx(
        motion.h2,
        {
          className: "text-xl font-bold mb-4",
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.5 },
          children: "Previously Ordered"
        }
      ),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "flex gap-4 overflow-x-auto scrollbar-hide pb-2",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.2, duration: 0.6 },
          children: previouslyOrderedProducts.slice(0, 12).map((product) => /* @__PURE__ */ jsx("div", { className: "flex-none w-48", children: /* @__PURE__ */ jsx(ProductCard, { product }) }, product.id))
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-8 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "container px-4 md:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsx(
          motion.h2,
          {
            className: "text-xl font-bold",
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.5 },
            children: "Featured Products"
          }
        ),
        /* @__PURE__ */ jsx(Link, { to: "/shop", className: "flex-none group text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg", children: /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5 text-primary" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-primary transition-colors block truncate", children: "View All" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(
        motion.div,
        {
          className: "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.2, duration: 0.6 },
          children: featuredProducts.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id))
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx(AiChatBot, {})
  ] });
};
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
const PRODUCTS_PER_PAGE = 25;
const ShopPage = () => {
  var _a;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const featuredParam = queryParams.get("featured");
  const searchParam = queryParams.get("search");
  const [searchInput, setSearchInput] = useState(searchParam || "");
  const [searchTerm, setSearchTerm] = useState(searchParam || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 2 || searchInput.length === 0) {
        setSearchTerm(searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    fetchCategories();
  }, []);
  useEffect(() => {
    setCurrentPage(0);
    setProducts([]);
    setHasMore(true);
    fetchProducts(true);
  }, [searchTerm, selectedCategory, sortBy, featuredParam]);
  const fetchCategories = async () => {
    try {
      let categoriesData = getQueryCache("categories_all");
      if (!categoriesData) {
        const { data, error } = await supabase.from("categories").select("*").order("name");
        if (error) throw error;
        categoriesData = data || [];
        setQueryCache("categories_all", categoriesData);
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  const fetchProducts = async (reset = false) => {
    const pageToFetch = reset ? 0 : currentPage;
    const cacheKey = `products_${featuredParam || "all"}_${searchTerm || "all"}_${selectedCategory}_${sortBy}_${pageToFetch}`;
    if (reset) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      let cachedProducts = getQueryCache(cacheKey);
      let newProducts = [];
      if (cachedProducts) {
        newProducts = cachedProducts;
      } else {
        let query = supabase.from("products").select(`
            *,
            categories (
              id,
              name
            )
          `);
        if (featuredParam === "true") {
          query = query.eq("featured", true);
        }
        if (searchTerm && searchTerm.length >= 2) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        if (selectedCategory !== "all") {
          const categoryId = parseInt(selectedCategory);
          query = query.or(`category_id.eq.${categoryId},categories_ids.cs.[${categoryId}]`);
        }
        switch (sortBy) {
          case "name-asc":
            query = query.order("name", { ascending: true });
            break;
          case "name-desc":
            query = query.order("name", { ascending: false });
            break;
          case "price-asc":
            query = query.order("price", { ascending: true });
            break;
          case "price-desc":
            query = query.order("price", { ascending: false });
            break;
          default:
            query = query.order("name", { ascending: true });
            break;
        }
        const from = pageToFetch * PRODUCTS_PER_PAGE;
        const to = from + PRODUCTS_PER_PAGE - 1;
        query = query.range(from, to);
        const { data: productsData, error: productsError } = await query;
        if (productsError) throw productsError;
        newProducts = productsData || [];
        setQueryCache(cacheKey, newProducts);
      }
      if (reset) {
        setProducts(newProducts);
        setCurrentPage(1);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
        setCurrentPage((prev) => prev + 1);
      }
      setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(false);
    }
  };
  const handleSearchInputChange = (value) => {
    setSearchInput(value);
  };
  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };
  const handleSortChange = (value) => {
    setSortBy(value);
  };
  const handleResetFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("all");
    setSortBy("name-asc");
  };
  const hasActiveFilters = searchInput || selectedCategory !== "all" || sortBy !== "name-asc";
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative min-h-[280px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/banner_bg.jpeg",
            alt: "Grocery Delivery",
            className: "w-full h-full object-cover opacity-20"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "container relative h-full px-4 md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-center h-full py-5", children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "space-y-3 max-w-4xl mx-auto w-full",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-xl md:text-2xl font-bold text-white mb-1", children: featuredParam === "true" ? "Featured Products" : "Shop" }),
              /* @__PURE__ */ jsx("p", { className: "text-white/90 text-sm", children: "Browse from our selection of groceries, household essentials and more." }),
              searchParam && /* @__PURE__ */ jsxs("p", { className: "text-white/80 text-xs mt-1", children: [
                'Showing results for: "',
                searchParam,
                '"'
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                className: "relative max-w-xl mx-auto",
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.2, duration: 0.5 },
                children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      type: "search",
                      placeholder: "Search for products...",
                      className: "h-9 pl-10 pr-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500",
                      value: searchInput,
                      onChange: (e) => handleSearchInputChange(e.target.value)
                    }
                  ),
                  searchInput.length > 0 && searchInput.length < 2 && /* @__PURE__ */ jsx("p", { className: "absolute -bottom-4 left-0 text-xs text-white/80", children: "Enter at least 2 characters to search" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxs(
              motion.div,
              {
                className: "flex flex-col sm:flex-row gap-2 items-center justify-center max-w-3xl mx-auto",
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.4, duration: 0.5 },
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-full sm:w-auto min-w-[160px]", children: /* @__PURE__ */ jsxs(Select, { value: selectedCategory, onValueChange: handleCategoryChange, children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-white/95 backdrop-blur-sm border-0 shadow-lg h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "All Categories" }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Categories" }),
                      categories.map((category) => /* @__PURE__ */ jsx(SelectItem, { value: category.id.toString(), children: category.name }, category.id))
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("div", { className: "w-full sm:w-auto min-w-[140px]", children: /* @__PURE__ */ jsxs(Select, { value: sortBy, onValueChange: handleSortChange, children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "bg-white/95 backdrop-blur-sm border-0 shadow-lg h-8 text-sm", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Sort by" }) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "name-asc", children: "Name (A-Z)" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "name-desc", children: "Name (Z-A)" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "price-asc", children: "Price (Low to High)" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "price-desc", children: "Price (High to Low)" })
                    ] })
                  ] }) }),
                  hasActiveFilters && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      className: "bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white text-gray-800 h-8 text-xs",
                      onClick: handleResetFilters,
                      children: [
                        /* @__PURE__ */ jsx(X, { className: "w-3 h-3 mr-1" }),
                        "Reset"
                      ]
                    }
                  )
                ]
              }
            ),
            hasActiveFilters && /* @__PURE__ */ jsxs(
              motion.div,
              {
                className: "flex flex-wrap gap-1 justify-center",
                initial: { y: 20, opacity: 0 },
                animate: { y: 0, opacity: 1 },
                transition: { delay: 0.6, duration: 0.5 },
                children: [
                  searchInput && /* @__PURE__ */ jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs", children: [
                    'Search: "',
                    searchInput,
                    '"'
                  ] }),
                  selectedCategory !== "all" && /* @__PURE__ */ jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs", children: [
                    "Category: ",
                    (_a = categories.find((c) => c.id.toString() === selectedCategory)) == null ? void 0 : _a.name
                  ] }),
                  sortBy !== "name-asc" && /* @__PURE__ */ jsxs("div", { className: "bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs", children: [
                    "Sort: ",
                    sortBy.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())
                  ] })
                ]
              }
            )
          ]
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: initialLoading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : products.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-32 p-8 text-center border rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "No products found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Try adjusting your search or filter criteria." }),
      hasActiveFilters && /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleResetFilters,
          className: "mt-4",
          variant: "outline",
          children: "Clear all filters"
        }
      )
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Showing ",
        products.length,
        " product",
        products.length !== 1 ? "s" : "",
        hasActiveFilters && " matching your criteria"
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "product-grid", children: products.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id)) }),
      hasMore && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-8", children: /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleLoadMore,
          disabled: loadingMore,
          variant: "outline",
          size: "lg",
          children: loadingMore ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }),
            "Loading..."
          ] }) : "Load More Products"
        }
      ) })
    ] }) })
  ] });
};
const CategoryCard = ({ category }) => {
  return /* @__PURE__ */ jsx(Link, { to: `/category/${category.id}`, children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      whileHover: { scale: 1.03 },
      className: "category-card overflow-hidden rounded-lg border bg-card",
      children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-square mx-auto bg-muted", children: /* @__PURE__ */ jsx(
          "img",
          {
            alt: category.name,
            className: "w-full h-full object-cover",
            src: category.icon_url || "https://images.unsplash.com/photo-1491696888587-6a2c0225c9fb"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "p-3 text-center", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium", children: category.name }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: category.description }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center mt-2 text-primary", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: "Shop now" }),
            /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 h-3 w-3" })
          ] })
        ] })
      ]
    }
  ) });
};
const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let cached = getQueryCache("categories_all");
        if (cached) {
          setCategories(cached);
        } else {
          const { data, error } = await supabase.from("categories").select("*").order("name");
          if (error) throw error;
          setCategories(data || []);
          setQueryCache("categories_all", data || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative h-[30vh] min-h-[200px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/banner_bg.jpeg",
            alt: "Fresh groceries",
            className: "w-full h-full object-cover opacity-20"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "container relative h-full px-4 md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-center h-full max-w-2xl", children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "space-y-2",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
          children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-white", children: "Categories" }),
            /* @__PURE__ */ jsx("p", { className: "text-white/90", children: "Browse our selection of grocery categories to find exactly what you need." })
          ]
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: categories.map((category, index) => /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, delay: index * 0.05 },
        children: /* @__PURE__ */ jsx(CategoryCard, { category })
      },
      category.id
    )) }) })
  ] });
};
const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      if (!id) return;
      setLoading(true);
      try {
        let categoryData = getQueryCache(`category_${id}`);
        let productsData = getQueryCache(`category_products_${id}`);
        if (!categoryData) {
          const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();
          if (error) throw error;
          categoryData = data;
          setQueryCache(`category_${id}`, data);
        }
        setCategory(categoryData);
        if (!productsData) {
          const { data, error } = await supabase.from("products").select(`*, categories ( id, name )`).or(`category_id.eq.${id},categories_ids.cs.[${id}]`).order("name");
          if (error) throw error;
          productsData = data || [];
          setQueryCache(`category_products_${id}`, productsData);
        }
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching category or products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryAndProducts();
  }, [id]);
  const filteredProducts = products.filter(
    (product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) });
  }
  if (!category) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Category Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "The category you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Link, { to: "/categories", children: /* @__PURE__ */ jsx(Button, { className: "mt-4", children: "Browse All Categories" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container px-4 py-8 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs(Link, { to: "/categories", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
      "Back to Categories"
    ] }) }),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        className: "mb-8",
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative h-48 overflow-hidden rounded-lg bg-muted mb-4",
            style: (category == null ? void 0 : category.icon_url) ? {
              backgroundImage: `url(${category.icon_url})`,
              backgroundRepeat: "repeat",
              backgroundSize: "60px",
              backgroundPosition: "center"
            } : {},
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[#3CB371] opacity-90" }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" }),
              /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 p-6", children: [
                /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-white", children: category.name }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-white/90", children: category.description })
              ] })
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "relative mb-6", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          type: "text",
          placeholder: `Search products in ${category.name}...`,
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          className: "w-full pl-10 pr-4 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        }
      )
    ] }),
    filteredProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-64 p-8 text-center border rounded-lg", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: searchQuery ? `No products found matching "${searchQuery}"` : "No products found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: searchQuery ? "Try a different search term." : "There are currently no products in this category." }),
      !searchQuery && // Only show browse all products button if no search query
      /* @__PURE__ */ jsx(Link, { to: "/shop", children: /* @__PURE__ */ jsx(Button, { className: "mt-4", children: "Browse All Products" }) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: [
      " ",
      filteredProducts.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id))
    ] })
  ] });
};
const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, updateQuantity, cart } = useCart();
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from("products").select(`
            *,
            categories (
              id,
              name
            )
          `).eq("id", id).single();
        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);
  const cartItem = cart.find((item) => (item == null ? void 0 : item.id) === (product == null ? void 0 : product.id));
  const quantity = cartItem ? cartItem.quantity : 0;
  const handleQuantityChange = (newQuantity) => {
    if (product) {
      updateQuantity(product.id, newQuantity);
    }
  };
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) });
  }
  if (!product) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Product Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "The product you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Link, { to: "/shop", children: /* @__PURE__ */ jsx(Button, { className: "mt-4", children: "Browse All Products" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container px-4 py-8 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxs(Link, { to: "/shop", className: "inline-flex items-center text-sm text-muted-foreground hover:text-foreground", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-1" }),
      "Back to Shop"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-8 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx(
        motion.div,
        {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.3 },
          className: "overflow-hidden rounded-lg bg-muted aspect-square",
          children: /* @__PURE__ */ jsx(
            "img",
            {
              alt: product.name,
              className: "w-full h-full object-cover",
              src: product.image_url || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg"
            }
          )
        }
      ),
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          transition: { duration: 0.3 },
          className: "space-y-6",
          children: [
            product.categories && /* @__PURE__ */ jsx(
              Link,
              {
                to: `/category/${product.categories.id}`,
                className: "inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary",
                children: product.categories.name
              }
            ),
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: product.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline space-x-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold", children: formatCurrency(product.price) }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
                "per ",
                product.unit
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: product.description }),
            /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-4", children: quantity > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "outline",
                    size: "icon",
                    className: "h-8 w-8",
                    onClick: () => handleQuantityChange(quantity - 1),
                    children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium w-6 text-center", children: quantity }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    size: "icon",
                    className: "h-8 w-8",
                    onClick: () => handleQuantityChange(quantity + 1),
                    children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
                  }
                )
              ] }) : /* @__PURE__ */ jsxs(
                Button,
                {
                  className: "flex-1",
                  onClick: handleAddToCart,
                  disabled: !product.in_stock,
                  children: [
                    /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
                    product.in_stock ? "Add to Cart" : "Out of Stock"
                  ]
                }
              ) }),
              quantity > 0 && /* @__PURE__ */ jsx("div", { className: "mt-6 text-sm text-muted-foreground", children: /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Total:" }),
                " ",
                formatCurrency(product.price * quantity)
              ] }) })
            ] })
          ]
        }
      )
    ] })
  ] });
};
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      className: cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ref,
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
const AddressSelector = ({ onSelect }) => {
  const { user } = useAuth();
  const addresses = (user == null ? void 0 : user.addresses) || [];
  return /* @__PURE__ */ jsx("div", { className: "space-y-2", children: addresses.map((addr) => /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "outline",
      className: "w-full justify-start text-left",
      onClick: () => onSelect(addr.address),
      children: [
        /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-2" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: addr.label }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate", children: addr.address })
        ] })
      ]
    },
    addr.id
  )) });
};
const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Enter your address",
  className,
  disabled,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const skipNextSearch = useRef(false);
  const debounceTimeout = useRef();
  const searchAddresses = async (searchValue) => {
    setLoading(true);
    try {
      if (searchValue.length >= 3) {
        const fallbackResponse = await supabase.from("adelaide_address_data").select("ADDRESS_LA, LOCALITY_N, POSTCODE").ilike("ADDRESS_LA", `%${searchValue.toUpperCase()}%`).limit(50);
        if (fallbackResponse.error) throw fallbackResponse.error;
        const transformedData = transformData(fallbackResponse.data);
        setSuggestions(transformedData);
        setShowSuggestions(transformedData.length > 0);
        return;
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      searchAddresses(value);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [value]);
  const transformData = (data) => {
    const keyMap = {
      ADDRESS_LA: "address",
      LOCALITY_N: "suburb",
      POSTCODE: "postcode"
    };
    return data.map((item) => {
      const transformedItem = {};
      for (const key in item) {
        transformedItem[keyMap[key] || key] = item[key];
      }
      return transformedItem;
    });
  };
  const handleInputChange = (e) => {
    onChange(e.target.value);
  };
  const handleSuggestionClick = (suggestion) => {
    skipNextSearch.current = true;
    onChange(suggestion.address);
    setShowSuggestions(false);
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.address,
        suburb: suggestion.suburb.toUpperCase(),
        postcode: suggestion.postcode
      });
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target) && suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        ref: inputRef,
        value,
        onChange: handleInputChange,
        onKeyDown: handleKeyDown,
        placeholder,
        className,
        disabled,
        ...props
      }
    ),
    showSuggestions && suggestions.length > 0 && /* @__PURE__ */ jsx(
      "div",
      {
        ref: suggestionsRef,
        className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto",
        children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0",
            onClick: () => handleSuggestionClick(suggestion),
            children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: suggestion.address }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500", children: [
                suggestion.suburb,
                ", ",
                suggestion.postcode
              ] })
            ]
          },
          index
        ))
      }
    ),
    loading && /* @__PURE__ */ jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }) })
  ] });
};
const CheckoutForm = ({ onDetailsChange, errors }) => {
  var _a;
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    deliveryNotes: ""
  });
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: "",
        postcode: "",
        deliveryNotes: ""
      });
    }
  }, [user]);
  useEffect(() => {
    const fetchPostcodes = async () => {
      const { data, error } = await supabase.from("postcodes").select("*").order("suburb");
      if (error) {
        console.error("Error fetching postcodes:", error);
        return;
      }
      setPostcodes(data);
      setFilteredPostcodes(data);
    };
    fetchPostcodes();
  }, []);
  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(
        (pc) => pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) || pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);
  useEffect(() => {
    onDetailsChange({ ...formData });
  }, [formData, onDetailsChange]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddressSelect = (address) => {
    const selectedAddress = user.addresses.find((addr) => addr.address === address);
    if (selectedAddress) {
      setFormData((prev) => ({
        ...prev,
        address: selectedAddress.address,
        postcode: selectedAddress.postcode
      }));
      const postcodeData = postcodes.find((pc) => pc.postcode === selectedAddress.postcode);
      if (postcodeData) {
        setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
      }
    }
    setShowAddressSelector(false);
  };
  const handleAddressAutocomplete = (addressDetails) => {
    setFormData((prev) => ({
      ...prev,
      address: addressDetails.address,
      postcode: addressDetails.postcode
    }));
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };
  const handlePostcodeSelect = (postcode) => {
    setFormData((prev) => ({ ...prev, postcode: postcode.postcode }));
    setPostcodeSearch(`${postcode.suburb}, ${postcode.postcode}`);
    setShowPostcodeDropdown(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
    /* @__PURE__ */ jsxs("h2", { className: "flex items-center text-xl font-semibold mb-4", children: [
      /* @__PURE__ */ jsx(Truck, { className: "mr-2 h-5 w-5 text-primary" }),
      "Delivery Information"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "name",
              name: "name",
              value: formData.name,
              onChange: handleChange,
              className: (errors == null ? void 0 : errors.name) ? "border-destructive" : ""
            }
          ),
          (errors == null ? void 0 : errors.name) && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email (Optional)" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              name: "email",
              type: "email",
              value: formData.email,
              onChange: handleChange,
              className: (errors == null ? void 0 : errors.email) ? "border-destructive" : ""
            }
          ),
          (errors == null ? void 0 : errors.email) && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.email })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "phone",
            name: "phone",
            value: formData.phone,
            onChange: handleChange,
            className: (errors == null ? void 0 : errors.phone) ? "border-destructive" : ""
          }
        ),
        (errors == null ? void 0 : errors.phone) && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.phone })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Delivery Address" }),
          user && ((_a = user.addresses) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              onClick: () => setShowAddressSelector(!showAddressSelector),
              className: "flex items-center text-primary",
              children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-1" }),
                showAddressSelector ? "Hide saved addresses" : "Use saved address"
              ]
            }
          )
        ] }),
        showAddressSelector && /* @__PURE__ */ jsx(AddressSelector, { onSelect: handleAddressSelect }),
        /* @__PURE__ */ jsx(
          AddressAutocomplete,
          {
            value: formData.address,
            onChange: (value) => setFormData((prev) => ({ ...prev, address: value })),
            onAddressSelect: handleAddressAutocomplete,
            placeholder: "Start typing your address...",
            className: (errors == null ? void 0 : errors.address) ? "border-destructive" : ""
          }
        ),
        (errors == null ? void 0 : errors.address) && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.address })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "postcode", children: "Suburb & Postcode" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "postcode",
              placeholder: "Search suburb or postcode...",
              value: postcodeSearch,
              onChange: (e) => {
                setPostcodeSearch(e.target.value);
                setShowPostcodeDropdown(true);
              },
              onFocus: () => setShowPostcodeDropdown(true),
              className: (errors == null ? void 0 : errors.postcode) ? "border-destructive" : ""
            }
          ),
          showPostcodeDropdown && filteredPostcodes.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto", children: filteredPostcodes.slice(0, 10).map((pc) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0",
              onClick: () => handlePostcodeSelect(pc),
              children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: pc.suburb }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: pc.postcode })
              ]
            },
            `${pc.suburb}-${pc.postcode}`
          )) })
        ] }),
        (errors == null ? void 0 : errors.postcode) && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.postcode })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "deliveryNotes", children: "Delivery Notes (Optional)" }),
        /* @__PURE__ */ jsx(
          Textarea,
          {
            id: "deliveryNotes",
            name: "deliveryNotes",
            value: formData.deliveryNotes,
            onChange: handleChange,
            placeholder: "E.g., Leave at the door, call upon arrival, etc.",
            rows: 3
          }
        )
      ] })
    ] })
  ] });
};
const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;
const OrderSummary = ({ deliveryFee = 0, appliedPromo = null, discountAmount = 0, serviceFee = 0 }) => {
  const { cart, getCartTotal } = useCart();
  const subtotal = getCartTotal();
  const total = subtotal - discountAmount + deliveryFee + serviceFee;
  return /* @__PURE__ */ jsxs("div", { className: "sticky top-20 p-6 border rounded-lg bg-muted/20", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Order Summary" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-60 overflow-y-auto pr-2 mb-4 custom-scrollbar", children: cart.length > 0 ? cart.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 mr-2", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-sm leading-tight", children: item.name }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          formatCurrency(item.price),
          " x ",
          item.quantity
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "font-medium text-sm whitespace-nowrap", children: formatCurrency(item.price * item.quantity) })
    ] }, item.id)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Your cart is empty." }) }),
    /* @__PURE__ */ jsx(Separator, { className: "my-4" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Subtotal" }),
        /* @__PURE__ */ jsx("span", { children: formatCurrency(subtotal) })
      ] }),
      appliedPromo && discountAmount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-green-600", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Discount (",
          appliedPromo.code,
          ")"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          "-",
          formatCurrency(discountAmount)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Delivery Fee" }),
        /* @__PURE__ */ jsx("span", { children: formatCurrency(deliveryFee) })
      ] }),
      serviceFee > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Service Fee" }),
        /* @__PURE__ */ jsx("span", { children: formatCurrency(serviceFee) })
      ] }),
      /* @__PURE__ */ jsx(Separator, { className: "my-2" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-base pt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "Total" }),
        /* @__PURE__ */ jsx("span", { children: formatCurrency(total) })
      ] })
    ] })
  ] });
};
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn("p-3", className),
      classNames: {
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      },
      components: {
        IconLeft: ({ ...props2 }) => /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }),
        IconRight: ({ ...props2 }) => /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
      },
      ...props
    }
  );
}
Calendar.displayName = "Calendar";
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Root,
    {
      className: cn("grid gap-2", className),
      ...props,
      ref
    }
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
const RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    RadioGroupPrimitive.Item,
    {
      ref,
      className: cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(RadioGroupPrimitive.Indicator, { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(Circle, { className: "h-2.5 w-2.5 fill-current text-current" }) })
    }
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
const DEFAULT_TIMEZONE = "Australia/Adelaide";
const getCurrentDateInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = /* @__PURE__ */ new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 6e4;
  const targetTime = new Date(utc + getTimezoneOffset(timezone) * 6e4);
  return targetTime;
};
const getTimezoneOffset = (timezone) => {
  const now = /* @__PURE__ */ new Date();
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
  const targetDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  return (targetDate.getTime() - utcDate.getTime()) / (1e3 * 60);
};
const formatDateForTimezone = (date, timezone = DEFAULT_TIMEZONE) => {
  const options = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  };
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  return formatter.format(date);
};
const formatTimeToAMPM = (timeString) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};
const formatTimeFromNumbers = (hour, minute) => {
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
};
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const displayTime = formatTimeFromNumbers(hour, minute);
      options.push({ value: timeString, label: displayTime });
    }
  }
  return options;
};
const isEndTimeAfterStartTime = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  return endMinutes > startMinutes;
};
const DeliveryOptions = ({ onDeliveryChange }) => {
  const [deliveryType, setDeliveryType] = useState("express");
  const [scheduledDate, setScheduledDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [deliveryFees, setDeliveryFees] = useState({ express: 0, scheduled: 0 });
  const [loadingFees, setLoadingFees] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingFees(true);
      try {
        const { data, error } = await supabase.from("delivery_settings").select("express_fee, scheduled_fee, timezone").eq("id", 1).single();
        if (error && error.code !== "PGRST116") throw error;
        setDeliveryFees({
          express: (data == null ? void 0 : data.express_fee) || 9.99,
          scheduled: (data == null ? void 0 : data.scheduled_fee) || 5.99
        });
        if (data == null ? void 0 : data.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error("Error fetching delivery settings:", error);
        setDeliveryFees({ express: 9.99, scheduled: 5.99 });
      } finally {
        setLoadingFees(false);
      }
    };
    fetchSettings();
  }, []);
  useEffect(() => {
    if (scheduledDate && deliveryType === "scheduled") {
      fetchAvailableTimeSlots(scheduledDate);
    }
  }, [scheduledDate, deliveryType, timezone]);
  useEffect(() => {
    let fee = 0;
    let deliveryTimestamp = null;
    let timeslotId = null;
    if (deliveryType === "express") {
      fee = deliveryFees.express;
    } else if (deliveryType === "scheduled" && selectedTimeSlot) {
      fee = deliveryFees.scheduled;
      const timeSlot = availableTimeSlots.find((slot) => slot.id === selectedTimeSlot);
      if (timeSlot) {
        const slotDate = /* @__PURE__ */ new Date(timeSlot.date + "T" + timeSlot.start_time);
        deliveryTimestamp = slotDate.toISOString();
        timeslotId = timeSlot.id;
      }
    }
    onDeliveryChange({
      type: deliveryType,
      fee,
      scheduledTime: deliveryTimestamp,
      timeslot_id: timeslotId
    });
  }, [deliveryType, selectedTimeSlot, deliveryFees, availableTimeSlots, onDeliveryChange]);
  const fetchAvailableTimeSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const dateString = formatDateForTimezone(date, timezone);
      const { data, error } = await supabase.from("time_slots").select("*").eq("date", dateString).eq("is_active", true).order("start_time");
      if (error) throw error;
      setAvailableTimeSlots(data || []);
      setSelectedTimeSlot("");
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };
  const handleDateSelect = (date) => {
    setScheduledDate(date);
    setSelectedTimeSlot("");
  };
  const isDateDisabled = (date) => {
    const today = getCurrentDateInTimezone(timezone);
    const todayStr = formatDateForTimezone(today, timezone);
    const dateStr = formatDateForTimezone(date, timezone);
    return dateStr < todayStr;
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium", children: "Delivery Options" }),
    /* @__PURE__ */ jsxs(RadioGroup, { value: deliveryType, onValueChange: setDeliveryType, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 p-4 border rounded-md has-[:checked]:border-primary", children: [
        /* @__PURE__ */ jsx(RadioGroupItem, { value: "express", id: "express" }),
        /* @__PURE__ */ jsxs(Label, { htmlFor: "express", className: "flex-1 cursor-pointer", children: [
          "Express Delivery (ASAP)",
          /* @__PURE__ */ jsx("span", { className: "block text-sm text-muted-foreground", children: loadingFees ? "Loading fee..." : `Fee: ${formatCurrency(deliveryFees.express)}` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 p-4 border rounded-md has-[:checked]:border-primary", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(RadioGroupItem, { value: "scheduled", id: "scheduled" }),
          /* @__PURE__ */ jsxs(Label, { htmlFor: "scheduled", className: "flex-1 cursor-pointer", children: [
            "Schedule Delivery",
            /* @__PURE__ */ jsx("span", { className: "block text-sm text-muted-foreground", children: loadingFees ? "Loading fee..." : `Fee: ${formatCurrency(deliveryFees.scheduled)}` })
          ] })
        ] }),
        deliveryType === "scheduled" && /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, height: 0 },
            animate: { opacity: 1, height: "auto" },
            exit: { opacity: 0, height: 0 },
            transition: { duration: 0.3 },
            className: "pl-6 space-y-4",
            children: [
              /* @__PURE__ */ jsxs(Popover, { children: [
                /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "outline",
                    className: cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    ),
                    children: [
                      /* @__PURE__ */ jsx(Calendar$1, { className: "mr-2 h-4 w-4" }),
                      scheduledDate ? format(scheduledDate, "PPP") : /* @__PURE__ */ jsx("span", { children: "Pick a date" })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", children: /* @__PURE__ */ jsx(
                  Calendar,
                  {
                    mode: "single",
                    selected: scheduledDate,
                    onSelect: handleDateSelect,
                    initialFocus: true,
                    disabled: isDateDisabled
                  }
                ) })
              ] }),
              scheduledDate && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Available Time Slots" }),
                loadingSlots ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-4", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }) }) : availableTimeSlots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No available time slots for this date." }) : /* @__PURE__ */ jsxs(Select, { value: selectedTimeSlot, onValueChange: setSelectedTimeSlot, children: [
                  /* @__PURE__ */ jsxs(SelectTrigger, { children: [
                    /* @__PURE__ */ jsx(Clock, { className: "mr-2 h-4 w-4 text-muted-foreground" }),
                    /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a time slot" })
                  ] }),
                  /* @__PURE__ */ jsx(SelectContent, { children: availableTimeSlots.map((slot) => /* @__PURE__ */ jsxs(SelectItem, { value: slot.id, children: [
                    formatTimeToAMPM(slot.start_time),
                    " - ",
                    formatTimeToAMPM(slot.end_time)
                  ] }, slot.id)) })
                ] })
              ] })
            ]
          }
        )
      ] })
    ] })
  ] });
};
const PromoCodeInput = ({ subtotal, onPromoApplied, appliedPromo, onPromoRemoved }) => {
  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast$1({ variant: "destructive", title: "Error", description: "Please enter a promo code" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("promo_codes").select("*").eq("code", promoCode.toUpperCase()).eq("is_active", true).single();
      if (error || !data) {
        toast$1({ variant: "destructive", title: "Invalid Code", description: "Promo code not found or expired" });
        return;
      }
      const now = /* @__PURE__ */ new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;
      if (now < validFrom) {
        toast$1({ variant: "destructive", title: "Invalid Code", description: "This promo code is not yet active" });
        return;
      }
      if (validUntil && now > validUntil) {
        toast$1({ variant: "destructive", title: "Expired Code", description: "This promo code has expired" });
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast$1({ variant: "destructive", title: "Code Limit Reached", description: "This promo code has reached its usage limit" });
        return;
      }
      if (data.minimum_order_amount && subtotal < data.minimum_order_amount) {
        toast$1({
          variant: "destructive",
          title: "Minimum Order Required",
          description: `Minimum order of ${formatCurrency(data.minimum_order_amount)} required for this promo code`
        });
        return;
      }
      let discountAmount = 0;
      if (data.discount_type === "percentage") {
        discountAmount = subtotal * data.discount_value / 100;
      } else {
        discountAmount = data.discount_value;
      }
      discountAmount = Math.min(discountAmount, subtotal);
      onPromoApplied({
        code: data.code,
        description: data.description,
        discountType: data.discount_type,
        discountValue: data.discount_value,
        discountAmount
      });
      toast$1({
        title: "Promo Code Applied",
        description: `You saved ${formatCurrency(discountAmount)}!`
      });
      setPromoCode("");
    } catch (error) {
      console.error("Error validating promo code:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Failed to validate promo code" });
    } finally {
      setLoading(false);
    }
  };
  const removePromoCode = () => {
    onPromoRemoved();
    toast$1({ title: "Promo Code Removed", description: "Promo code has been removed from your order" });
  };
  if (appliedPromo) {
    return /* @__PURE__ */ jsx("div", { className: "p-4 border rounded-lg bg-green-50 border-green-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx(Tag, { className: "w-4 h-4 text-green-600" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium text-green-800", children: appliedPromo.code }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-green-600", children: appliedPromo.description }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-green-600", children: [
            "Discount: ",
            formatCurrency(appliedPromo.discountAmount)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: removePromoCode,
          className: "text-green-600 hover:text-green-800",
          children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        id: "promo-code",
        value: promoCode,
        onChange: (e) => setPromoCode(e.target.value.toUpperCase()),
        placeholder: "Enter promo code",
        disabled: loading
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        onClick: validatePromoCode,
        disabled: loading || !promoCode.trim(),
        variant: "outline",
        children: loading ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }) : "Apply"
      }
    )
  ] }) });
};
const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    type: "express",
    fee: 0,
    scheduledTime: null,
    timeslot_id: null
  });
  const [customerDetails, setCustomerDetails] = useState({ name: "", email: "", phone: "", address: "", deliveryNotes: "" });
  const [formErrors, setFormErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    name: "",
    address: "",
    postcode: ""
  });
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [serviceFeePercent, setServiceFeePercent] = useState(3);
  useEffect(() => {
    const fetchInitialFee = async () => {
      try {
        const { data, error } = await supabase.from("delivery_settings").select("express_fee").eq("id", 1).single();
        if (error && error.code !== "PGRST116") throw error;
        setDeliveryDetails((prev) => ({ ...prev, fee: (data == null ? void 0 : data.express_fee) || 9.99 }));
      } catch (error) {
        console.error("Error fetching initial delivery fee:", error);
        setDeliveryDetails((prev) => ({ ...prev, fee: 9.99 }));
      }
    };
    const fetchPostcodes = async () => {
      const { data, error } = await supabase.from("postcodes").select("*").order("suburb");
      if (error) {
        console.error("Error fetching postcodes:", error);
        return;
      }
      setPostcodes(data);
      setFilteredPostcodes(data);
    };
    const checkIfAccountSet = () => {
      if (user) {
        const isAccountIncomplete = !user.name || !user.addresses || user.addresses.length === 0;
        setShowAccountSetup(isAccountIncomplete);
        if (!isAccountIncomplete) {
          document.cookie = "accountSetup=true; max-age=86400";
        }
      }
    };
    fetchInitialFee();
    fetchPostcodes();
    checkIfAccountSet();
  }, [user]);
  useEffect(() => {
    const fetchServiceFee = async () => {
      const { data, error } = await supabase.from("delivery_settings").select("service_fee_percent").eq("id", 1).single();
      if (!error && data && data.service_fee_percent) {
        setServiceFeePercent(data.service_fee_percent);
      }
    };
    fetchServiceFee();
  }, []);
  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(
        (pc) => pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) || pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);
  const handleAccountSetup = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({
        name: accountDetails.name,
        addresses: [{
          id: Date.now().toString(),
          label: "Default",
          address: accountDetails.address,
          postcode: accountDetails.postcode
        }]
      });
      setShowAccountSetup(false);
      document.cookie = "accountSetup=true; max-age=86400";
      toast$1({ title: "Success", description: "Account details updated successfully" });
    } catch (error) {
      console.error("Error updating account:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Failed to update account details" });
    }
  };
  const handleAddressAutocomplete = (addressDetails) => {
    setAccountDetails((prev) => ({
      ...prev,
      address: addressDetails.address,
      postcode: addressDetails.postcode
    }));
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };
  const handlePostcodeSelect = (postcode) => {
    setAccountDetails((prev) => ({ ...prev, postcode: postcode.postcode }));
    setPostcodeSearch(`${postcode.suburb}, ${postcode.postcode}`);
    setShowPostcodeDropdown(false);
  };
  const handleDeliveryChange = useCallback((details) => {
    setDeliveryDetails(details);
  }, []);
  const handleDetailsChange = useCallback((details) => {
    setCustomerDetails(details);
  }, []);
  const handlePromoApplied = (promo) => {
    setAppliedPromo(promo);
  };
  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };
  const getSubtotal = () => {
    return Number(getCartTotal() || 0);
  };
  const getDiscountAmount = () => {
    return Number(appliedPromo ? appliedPromo.discountAmount : 0);
  };
  const getServiceFee = () => {
    const base = getSubtotal() + Number(deliveryDetails.fee || 0);
    return parseFloat((base * (serviceFeePercent / 100)).toFixed(2));
  };
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const deliveryFee = Number(deliveryDetails.fee || 0);
    const serviceFee = getServiceFee();
    const total = subtotal - discount + deliveryFee + serviceFee;
    return parseFloat(total.toFixed(2));
  };
  if (cart.length === 0 && !isSubmitting) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your cart is empty" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Add products to checkout." }),
      /* @__PURE__ */ jsx(Button, { className: "mt-4", onClick: () => navigate("/shop"), children: "Continue Shopping" })
    ] }) });
  }
  const orderData = {
    customer_name: customerDetails.name,
    customer_email: customerDetails.email,
    customer_phone: customerDetails.phone,
    customer_address: customerDetails.address,
    customer_postcode: customerDetails.postcode,
    customer_city: customerDetails.city,
    delivery_notes: customerDetails.deliveryNotes,
    delivery_type: deliveryDetails.type,
    scheduled_delivery_time: deliveryDetails.scheduledTime,
    timeslot_id: deliveryDetails.timeslot_id,
    promo_code: (appliedPromo == null ? void 0 : appliedPromo.code) || null,
    discount_amount: getDiscountAmount()
  };
  return /* @__PURE__ */ jsxs("div", { className: "container px-4 py-8 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight mb-8", children: "Checkout" }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-8 lg:grid-cols-[1fr_350px]", children: [
            /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.1 },
                children: !user ? /* @__PURE__ */ jsxs("div", { className: "mt-6 p-6 border rounded-lg bg-muted/30", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Sign in to Continue" }),
                  /* @__PURE__ */ jsx(PhoneLoginForm, { onSuccess: () => {
                  } })
                ] }) : showAccountSetup ? /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg bg-muted/30", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Complete Your Account Details" }),
                  /* @__PURE__ */ jsxs("form", { onSubmit: handleAccountSetup, className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
                      /* @__PURE__ */ jsx(
                        Input,
                        {
                          id: "name",
                          value: accountDetails.name,
                          onChange: (e) => setAccountDetails((prev) => ({ ...prev, name: e.target.value })),
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Delivery Address" }),
                      /* @__PURE__ */ jsx(
                        AddressAutocomplete,
                        {
                          value: accountDetails.address,
                          onChange: (value) => setAccountDetails((prev) => ({ ...prev, address: value })),
                          onAddressSelect: handleAddressAutocomplete,
                          placeholder: "Start typing your address...",
                          required: true
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                      /* @__PURE__ */ jsx(Label, { htmlFor: "postcode", children: "Suburb & Postcode" }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx(
                          Input,
                          {
                            id: "postcode",
                            placeholder: "Search suburb or postcode...",
                            value: postcodeSearch,
                            onChange: (e) => {
                              setPostcodeSearch(e.target.value);
                              setShowPostcodeDropdown(true);
                            },
                            onFocus: () => setShowPostcodeDropdown(true),
                            required: true
                          }
                        ),
                        showPostcodeDropdown && filteredPostcodes.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto", children: filteredPostcodes.slice(0, 10).map((pc) => /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className: "px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0",
                            onClick: () => handlePostcodeSelect(pc),
                            children: [
                              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: pc.suburb }),
                              /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: pc.postcode })
                            ]
                          },
                          `${pc.suburb}-${pc.postcode}`
                        )) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save Details" })
                  ] })
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(CheckoutForm, { onDetailsChange: handleDetailsChange, errors: formErrors }),
                  /* @__PURE__ */ jsx(DeliveryOptions, { onDeliveryChange: handleDeliveryChange }),
                  /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-4", children: "Promo Code" }),
                    /* @__PURE__ */ jsx(
                      PromoCodeInput,
                      {
                        subtotal: getSubtotal(),
                        onPromoApplied: handlePromoApplied,
                        appliedPromo,
                        onPromoRemoved: handlePromoRemoved
                      }
                    )
                  ] })
                ] })
              }
            ) }),
            /* @__PURE__ */ jsx(
              motion.div,
              {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.2 },
                className: "lg:sticky lg:top-20",
                children: /* @__PURE__ */ jsx(
                  OrderSummary,
                  {
                    deliveryFee: deliveryDetails.fee,
                    appliedPromo,
                    discountAmount: getDiscountAmount(),
                    serviceFee: getServiceFee()
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  id: "terms",
                  checked: termsAccepted,
                  onCheckedChange: setTermsAccepted
                }
              ),
              /* @__PURE__ */ jsxs(Label, { htmlFor: "terms", className: "text-sm", children: [
                "I agree to the ",
                /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-primary hover:underline", target: "_blank", children: "Terms and Conditions" }),
                " and",
                " ",
                /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-primary hover:underline", target: "_blank", children: "Privacy Policy" })
              ] })
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center w-full mt-8 mb-4", children: /* @__PURE__ */ jsxs(
      Button,
      {
        className: "w-full max-w-xl text-base h-12 md:h-12 md:text-lg shadow-lg",
        onClick: () => navigate("/stripe-payment", { state: { orderData, deliveryFee: deliveryDetails.fee, finalTotal: getFinalTotal(), serviceFee: getServiceFee() } }),
        disabled: !user || !termsAccepted || showAccountSetup || customerDetails.address.length === 0 || getSubtotal() <= 0 || isSubmitting,
        children: [
          "Proceed to Payment   ",
          /* @__PURE__ */ jsx(CreditCard, {})
        ]
      }
    ) })
  ] });
};
const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      try {
        const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", id).single();
        if (orderError) throw orderError;
        if (orderData) {
          setOrder(orderData);
          if (orderData.expected_delivery_at === null) {
            let currentTime = (/* @__PURE__ */ new Date()).getTime();
            let updatedTIme = new Date(currentTime + 45 * 60 * 1e3);
            setDeliveryTime(updatedTIme);
          } else {
            setDeliveryTime(new Date(orderData.expected_delivery_at));
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  };
  const getStatusInfo = () => {
    if (!order) return null;
    const statusConfig = {
      pending: {
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        icon: Clock,
        title: "Order Pending",
        description: deliveryTime ? `Estimated delivery by ${formatDate(deliveryTime)}` : "Processing your order"
      },
      processing: {
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        icon: Package,
        title: "Order Processing",
        description: "Your order is being prepared"
      },
      delivered: {
        color: "text-green-500",
        bgColor: "bg-green-100",
        icon: CheckCircle,
        title: "Order Delivered",
        description: "Your order has been delivered"
      },
      cancelled: {
        color: "text-red-500",
        bgColor: "bg-red-100",
        icon: XCircle,
        title: "Order Cancelled",
        description: "This order has been cancelled"
      }
    };
    return statusConfig[order.status] || statusConfig.pending;
  };
  const canCancel = order && ["pending", "processing"].includes(order.status);
  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to cancel this order? Cancellation fees may apply.")) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
      if (error) throw error;
      setOrder({ ...order, status: "cancelled" });
    } catch (err) {
      setCancelError("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const currentMessages = order.admin_messages || [];
      const message = {
        from: "customer",
        message: newMessage.trim(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("orders").update({ admin_messages: [...currentMessages, message] }).eq("id", order.id);
      if (error) throw error;
      setOrder((prev) => ({ ...prev, admin_messages: [...currentMessages, message] }));
      setNewMessage("");
    } catch (error) {
      setCancelError("Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) });
  }
  if (!order) {
    return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-64 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Order Not Found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "The order you're looking for doesn't exist." }),
      /* @__PURE__ */ jsx(Link, { to: "/shop", children: /* @__PURE__ */ jsx(Button, { className: "mt-4", children: "Continue Shopping" }) })
    ] }) });
  }
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.5 },
      className: "max-w-2xl mx-auto",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
          /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: { scale: 0.5, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              transition: { duration: 0.5 },
              className: `mx-auto w-24 h-24 rounded-full ${statusInfo.bgColor} flex items-center justify-center mb-4`,
              children: /* @__PURE__ */ jsx(StatusIcon, { className: `w-12 h-12 ${statusInfo.color}` })
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-2", children: statusInfo.title }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: statusInfo.description })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-1/2 w-full h-1 bg-muted transform -translate-y-1/2", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: `h-full bg-primary transition-all duration-500 ${order.status === "pending" ? "w-1/3" : order.status === "processing" ? "w-2/3" : order.status === "delivered" ? "w-full" : "w-0"}`
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${["pending", "processing", "delivered"].includes(order.status) ? "bg-primary text-primary-foreground" : "bg-muted"}`, children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("span", { className: "mt-2 text-sm", children: "Confirmed" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${["processing", "delivered"].includes(order.status) ? "bg-primary text-primary-foreground" : "bg-muted"}`, children: /* @__PURE__ */ jsx(Package, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("span", { className: "mt-2 text-sm", children: "Processing" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center ${order.status === "delivered" ? "bg-primary text-primary-foreground" : "bg-muted"}`, children: /* @__PURE__ */ jsx(Truck, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("span", { className: "mt-2 text-sm", children: "Delivered" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 p-6 border rounded-lg text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold", children: [
              "Order #",
              order.id.slice(0, 6).toUpperCase()
            ] }),
            /* @__PURE__ */ jsx("span", { className: `px-3 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`, children: order.status.charAt(0).toUpperCase() + order.status.slice(1) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Order Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: formatDate(order.created_at) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Delivery Address" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: order.customer_address })
            ] }),
            order.delivery_notes && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Delivery Notes" }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: order.delivery_notes })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-4", children: "Order Items" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: order.items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium", children: item.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                  formatCurrency(item.price),
                  " x ",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: formatCurrency(item.price * item.quantity) })
            ] }, index)) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t flex justify-between font-bold", children: [
              /* @__PURE__ */ jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(order.total) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col sm:flex-row items-center justify-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { to: "/shop", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Continue Shopping" }) }),
          /* @__PURE__ */ jsx(Link, { to: "/account/orders", children: /* @__PURE__ */ jsxs(Button, { children: [
            /* @__PURE__ */ jsx(Package, { className: "mr-2 h-4 w-4" }),
            "View All Orders"
          ] }) }),
          canCancel && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "destructive",
              onClick: handleCancelOrder,
              disabled: cancelling,
              children: cancelling ? "Cancelling..." : "Cancel Order"
            }
          )
        ] }),
        cancelError && /* @__PURE__ */ jsx("div", { className: "mt-4 text-red-500 text-center", children: cancelError }),
        order.payment_status === "paid" && order.payment_data && /* @__PURE__ */ jsxs("div", { className: "mt-8 p-4 bg-green-50 border border-green-200 rounded", children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium mb-1 text-green-800", children: "Payment Details:" }),
          /* @__PURE__ */ jsx("pre", { className: "text-xs text-green-900 whitespace-pre-wrap break-all", children: JSON.stringify(order.payment_data, null, 2) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-2", children: "Support Messages" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto", children: order.admin_messages && order.admin_messages.length > 0 ? order.admin_messages.map((message, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `p-3 rounded text-sm ${message.from === "admin" ? "bg-blue-50 border-l-4 border-blue-400 ml-4" : "bg-gray-50 border-l-4 border-gray-400 mr-4"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: message.from === "admin" ? "Support Team" : "You" }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: new Date(message.timestamp).toLocaleString() })
                ] }),
                /* @__PURE__ */ jsx("p", { children: message.message })
              ]
            },
            index
          )) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No messages yet. Send a message to our team if you have any questions." }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-4", children: [
            /* @__PURE__ */ jsx("label", { className: "block font-medium", children: "Send a message:" }),
            /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: newMessage,
                  onChange: (e) => setNewMessage(e.target.value),
                  placeholder: "Type your message...",
                  rows: 2,
                  className: "flex-1 border rounded p-2"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: handleSendMessage,
                  disabled: !newMessage.trim() || sendingMessage,
                  size: "sm",
                  children: sendingMessage ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" })
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  ) });
};
const AdminLoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting || authLoading) return;
    setIsSubmitting(true);
    const { success, isAdminUser, error } = await login(formData.email, formData.password);
    if (success) {
      if (isAdminUser) {
        navigate("/admin");
        toast$1({ title: "Admin Access Granted", description: "Welcome to the Admin Dashboard." });
      } else {
        toast$1({ variant: "destructive", title: "Access Denied", description: "You do not have admin privileges. Logging out." });
        await logout();
      }
    } else {
      if (error && error !== "Invalid login credentials") {
        toast$1({ variant: "destructive", title: "Login Failed", description: error });
      }
    }
    setIsSubmitting(false);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "admin-email", children: "Admin Email" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "admin-email",
          name: "email",
          type: "email",
          value: formData.email,
          onChange: handleChange,
          placeholder: "admin_master@groceroo.com.au",
          className: `${errors.email ? "border-destructive" : ""} focus:border-destructive/80`,
          disabled: isSubmitting || authLoading
        }
      ),
      errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "admin-password", children: "Admin Password" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "admin-password",
          name: "password",
          type: "password",
          value: formData.password,
          onChange: handleChange,
          placeholder: "••••••••",
          className: `${errors.password ? "border-destructive" : ""} focus:border-destructive/80`,
          disabled: isSubmitting || authLoading
        }
      ),
      errors.password && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.password })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-sm text-right", children: /* @__PURE__ */ jsx(Link, { to: "/forgot-password", className: `text-muted-foreground hover:text-destructive ${isSubmitting || authLoading ? "pointer-events-none opacity-50" : ""}`, children: "Forgot password?" }) }),
    /* @__PURE__ */ jsx(Button, { type: "submit", variant: "destructive", className: "w-full", disabled: isSubmitting || authLoading, children: isSubmitting || authLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "mr-2 h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" }),
      "Authenticating..."
    ] }) : "Sign In to Admin Portal" })
  ] });
};
const AdminLoginPage = () => {
  return /* @__PURE__ */ jsx("div", { className: "container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
        className: "flex flex-col items-center mb-8 text-center",
        children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "w-12 h-12 mb-4 text-destructive" }),
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-destructive", children: "Admin Portal" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Authorized personnel access only." })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.1 },
        className: "p-6 border-2 border-destructive/30 rounded-lg shadow-xl bg-card",
        children: /* @__PURE__ */ jsx(AdminLoginForm, {})
      }
    ),
    /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5, delay: 0.3 },
        className: "mt-8 text-center text-sm",
        children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          "Not an admin? Return to",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/", className: "text-primary hover:underline", children: "Homepage" }),
          " ",
          "or",
          " ",
          /* @__PURE__ */ jsx(Link, { to: "/login", className: "text-primary hover:underline", children: "Customer Login" }),
          "."
        ] })
      }
    )
  ] }) });
};
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || loading) return;
    setLoading(true);
    const success = await register(
      formData.email,
      formData.password,
      formData.name,
      formData.phone
    );
    setLoading(false);
    if (success) {
      navigate("/login");
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        className: "text-center mb-8",
        children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Create an Account" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Sign up to start shopping with Groceroo" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, delay: 0.1 },
        className: "p-6 border rounded-lg",
        children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
              /* @__PURE__ */ jsx(Input, { id: "name", name: "name", value: formData.name, onChange: handleChange, className: errors.name ? "border-destructive" : "", disabled: loading }),
              errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
              /* @__PURE__ */ jsx(Input, { id: "email", name: "email", type: "email", value: formData.email, onChange: handleChange, className: errors.email ? "border-destructive" : "", disabled: loading }),
              errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
              /* @__PURE__ */ jsx(Input, { id: "phone", name: "phone", value: formData.phone, onChange: handleChange, className: errors.phone ? "border-destructive" : "", disabled: loading }),
              errors.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.phone })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Password" }),
              /* @__PURE__ */ jsx(Input, { id: "password", name: "password", type: "password", value: formData.password, onChange: handleChange, className: errors.password ? "border-destructive" : "", disabled: loading }),
              errors.password && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.password })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password" }),
              /* @__PURE__ */ jsx(Input, { id: "confirmPassword", name: "confirmPassword", type: "password", value: formData.confirmPassword, onChange: handleChange, className: errors.confirmPassword ? "border-destructive" : "", disabled: loading }),
              errors.confirmPassword && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.confirmPassword })
            ] }),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" }),
              "Creating Account..."
            ] }) : "Create Account" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 text-center text-sm", children: /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
            "Already have an account?",
            " ",
            /* @__PURE__ */ jsx(Link, { to: "/login", className: `text-primary hover:underline ${loading ? "pointer-events-none opacity-50" : ""}`, children: "Sign in" })
          ] }) })
        ]
      }
    )
  ] }) });
};
const Tabs = TabsPrimitive.Root;
const TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
const TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
const AddressManager = () => {
  const { user, updateUserInfo } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ label: "", address: "", postcode: "" });
  const [loading, setLoading] = useState(false);
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const addresses = (user == null ? void 0 : user.addresses) || [];
  useEffect(() => {
    const fetchPostcodes = async () => {
      const { data, error } = await supabase.from("postcodes").select("*").order("suburb");
      if (error) {
        console.error("Error fetching postcodes:", error);
        return;
      }
      setPostcodes(data);
      setFilteredPostcodes(data);
    };
    fetchPostcodes();
  }, []);
  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(
        (pc) => pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) || pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.address.trim() || !formData.postcode) {
      toast$1({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
      return;
    }
    setLoading(true);
    try {
      let newAddresses;
      if (editingAddress) {
        newAddresses = addresses.map(
          (addr) => addr.id === editingAddress.id ? { ...addr, label: formData.label, address: formData.address, postcode: formData.postcode } : addr
        );
      } else {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        newAddresses = [...addresses, {
          id: uniqueId,
          label: formData.label,
          address: formData.address,
          postcode: formData.postcode
        }];
      }
      await updateUserInfo({ addresses: newAddresses });
      setIsDialogOpen(false);
      setEditingAddress(null);
      setFormData({ label: "", address: "", postcode: "" });
      setPostcodeSearch("");
      toast$1({ title: "Success", description: editingAddress ? "Address updated" : "Address added" });
    } catch (error) {
      console.error("Error saving address:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not save address" });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (addressId) => {
    try {
      const newAddresses = addresses.filter((addr) => addr.id !== addressId);
      await updateUserInfo({ addresses: newAddresses });
      toast$1({ title: "Success", description: "Address deleted" });
    } catch (error) {
      console.error("Error deleting address:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not delete address" });
    }
  };
  const handleAddressAutocomplete = (addressDetails) => {
    setFormData((prev) => ({
      ...prev,
      address: addressDetails.address,
      postcode: addressDetails.postcode
    }));
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };
  const handlePostcodeSelect = (postcode) => {
    setFormData((prev) => ({ ...prev, postcode: postcode.postcode }));
    setPostcodeSearch(`${postcode.suburb}, ${postcode.postcode}`);
    setShowPostcodeDropdown(false);
  };
  const openDialog = (address = null) => {
    setEditingAddress(address);
    if (address) {
      setFormData({
        label: address.label,
        address: address.address,
        postcode: address.postcode
      });
      const postcodeData = postcodes.find((pc) => pc.postcode === address.postcode);
      if (postcodeData) {
        setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
      }
    } else {
      setFormData({ label: "", address: "", postcode: "" });
      setPostcodeSearch("");
    }
    setIsDialogOpen(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Saved Addresses" }),
      /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
        /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: () => openDialog(), children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
          "Add Address"
        ] }) }),
        /* @__PURE__ */ jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingAddress ? "Edit Address" : "Add New Address" }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "label", children: "Label" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "label",
                  placeholder: "e.g., Home, Work",
                  value: formData.label,
                  onChange: (e) => setFormData((prev) => ({ ...prev, label: e.target.value })),
                  disabled: loading
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Address" }),
              /* @__PURE__ */ jsx(
                AddressAutocomplete,
                {
                  value: formData.address,
                  onChange: (value) => setFormData((prev) => ({ ...prev, address: value })),
                  onAddressSelect: handleAddressAutocomplete,
                  placeholder: "Start typing your address...",
                  disabled: loading
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "postcode", children: "Suburb & Postcode" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "postcode",
                    placeholder: "Search suburb or postcode...",
                    value: postcodeSearch,
                    onChange: (e) => {
                      setPostcodeSearch(e.target.value);
                      setShowPostcodeDropdown(true);
                    },
                    onFocus: () => setShowPostcodeDropdown(true),
                    disabled: loading
                  }
                ),
                showPostcodeDropdown && filteredPostcodes.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto", children: filteredPostcodes.slice(0, 10).map((pc) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0",
                    onClick: () => handlePostcodeSelect(pc),
                    children: [
                      /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: pc.suburb }),
                      /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: pc.postcode })
                    ]
                  },
                  `${pc.suburb}-${pc.postcode}`
                )) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end space-x-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  type: "button",
                  variant: "outline",
                  onClick: () => {
                    setIsDialogOpen(false);
                    setShowPostcodeDropdown(false);
                  },
                  disabled: loading,
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(Button, { type: "submit", disabled: loading, children: loading ? "Saving..." : editingAddress ? "Update" : "Add" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: addresses.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground py-4", children: "No addresses saved yet." }) : addresses.map((addr) => {
      const postcode = postcodes.find((pc) => pc.postcode === addr.postcode);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between p-4 border rounded-lg",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: addr.label }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: addr.address }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: postcode ? `${postcode.suburb}, ${postcode.postcode}` : addr.postcode })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => openDialog(addr),
                  children: /* @__PURE__ */ jsx(Edit2, { className: "w-4 h-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "text-destructive hover:text-destructive",
                  onClick: () => handleDelete(addr.id),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                }
              )
            ] })
          ]
        },
        addr.id
      );
    }) })
  ] });
};
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "h3",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "p",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
const UpcomingOrders = ({ orders }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };
  if (orders.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex flex-col items-center justify-center py-8", children: [
      /* @__PURE__ */ jsx(Package, { className: "w-12 h-12 text-muted-foreground mb-4" }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium mb-2", children: "No upcoming orders" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center", children: "Your scheduled pickup orders will appear here." })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-2", children: orders.map((order) => {
    var _a, _b;
    return /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        children: /* @__PURE__ */ jsxs(Card, { className: "py-2", children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "text-base", children: [
              "Order #",
              order.id.slice(0, 6).toUpperCase()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Badge, { className: getStatusColor(order.status), children: order.status.charAt(0).toUpperCase() + order.status.slice(1) }),
              /* @__PURE__ */ jsx(Link, { to: `/pickup-order/${order.id}`, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", children: /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) }) })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx(Calendar$1, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                formatDate(order.pickup_date)
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                order.time_slot
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center text-xs", children: [
              /* @__PURE__ */ jsx(Store, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: (_a = order.pickup_order_stores) == null ? void 0 : _a.map((storeOrder, index) => {
                var _a2;
                return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: (_a2 = storeOrder.stores) == null ? void 0 : _a2.name }, index);
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
              /* @__PURE__ */ jsx("span", { children: "Estimated Total:" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(order.estimated_total) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-medium mb-1", children: "Store Details:" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-1", children: (_b = order.pickup_order_stores) == null ? void 0 : _b.map((storeOrder, index) => {
                var _a2;
                return /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs bg-muted/30 p-1 rounded", children: [
                  /* @__PURE__ */ jsx("span", { children: (_a2 = storeOrder.stores) == null ? void 0 : _a2.name }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-medium", children: formatCurrency(storeOrder.estimated_total || 0) }),
                    /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: storeOrder.status })
                  ] })
                ] }, index);
              }) })
            ] }),
            order.photos && order.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-medium mb-1", children: "Photos:" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1", children: [
                order.photos.slice(0, 4).map((photo, index) => /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: photo.data,
                    alt: `Photo ${index + 1}`,
                    className: "aspect-square rounded object-cover cursor-pointer",
                    onClick: () => window.open(photo.data, "_blank")
                  },
                  index
                )),
                order.photos.length > 4 && /* @__PURE__ */ jsxs("div", { className: "aspect-square rounded bg-muted flex items-center justify-center text-xs text-muted-foreground", children: [
                  "+",
                  order.photos.length - 4,
                  " more"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-1", children: /* @__PURE__ */ jsx(Link, { to: `/pickup-order/${order.id}`, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "View Full Details" }) }) })
          ] })
        ] })
      },
      order.id
    );
  }) });
};
const AccountPage = () => {
  const { user, updateUserInfo, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pickupOrders, setPickupOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
      fetchUserOrders(user.id);
      fetchPickupOrders(user.id);
    }
  }, [user, authLoading, navigate]);
  const fetchUserOrders = async (userId) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  const fetchPickupOrders = async (userId) => {
    try {
      const { data, error } = await supabase.from("pickup_orders").select(`
          *,
          pickup_order_stores (
            id,
            store_id,
            estimated_total,
            actual_total,
            notes,
            status,
            stores (name, address)
          )
        `).eq("user_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      setPickupOrders(data || []);
    } catch (error) {
      console.error("Error fetching pickup orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };
  const handleSendMessage = async (orderId, message) => {
    try {
      const { data: currentOrder, error: fetchError } = await supabase.from("pickup_orders").select("admin_messages").eq("id", orderId).single();
      if (fetchError) throw fetchError;
      const currentMessages = currentOrder.admin_messages || [];
      const newMessage = {
        from: "customer",
        message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error: updateError } = await supabase.from("pickup_orders").update({
        admin_messages: [...currentMessages, newMessage]
      }).eq("id", orderId);
      if (updateError) throw updateError;
      fetchPickupOrders(user.id);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateUserInfo({
        name: formData.name,
        email: formData.email
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  };
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100";
    }
  };
  if (authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "container flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container px-4 py-8 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsx(
      motion.h1,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        className: "text-3xl font-bold tracking-tight mb-6",
        children: "My Account"
      }
    ),
    /* @__PURE__ */ jsxs(Tabs, { defaultValue: "profile", className: "space-y-6", children: [
      /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-3 md:w-auto md:inline-flex", children: [
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 mr-2" }),
          "Profile"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "orders", className: "flex items-center", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-4 h-4 mr-2" }),
          "Orders"
        ] }),
        /* @__PURE__ */ jsxs(TabsTrigger, { value: "grocery-runs", className: "flex items-center", children: [
          /* @__PURE__ */ jsx(Store, { className: "w-4 h-4 mr-2" }),
          "Grocery Runs"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(TabsContent, { value: "profile", className: "space-y-6", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3 },
            className: "p-6 border rounded-lg",
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Personal Information" }),
              /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "name",
                        name: "name",
                        value: formData.name,
                        onChange: handleChange,
                        className: errors.name ? "border-destructive" : "",
                        disabled: isSubmitting
                      }
                    ),
                    errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "email",
                        name: "email",
                        type: "email",
                        value: formData.email,
                        onChange: handleChange,
                        className: errors.email ? "border-destructive" : "",
                        disabled: isSubmitting
                      }
                    ),
                    errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.email })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
                  /* @__PURE__ */ jsx(
                    Input,
                    {
                      id: "phone",
                      name: "phone",
                      value: formData.phone,
                      className: "bg-muted/50",
                      disabled: true
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Phone number cannot be changed." })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex justify-end space-x-2", children: /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Saving..." : "Save Changes" }) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.1 },
            className: "p-6 border rounded-lg",
            children: /* @__PURE__ */ jsx(AddressManager, {})
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.2 },
            className: "p-6 border rounded-lg",
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Account Actions" }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  variant: "destructive",
                  className: "flex items-center",
                  onClick: handleLogout,
                  disabled: isSubmitting,
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4 mr-2" }),
                    "Logout"
                  ]
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx(TabsContent, { value: "orders", className: "space-y-6", children: /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Delivery Orders" }),
        loadingOrders ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-40", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : orders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-12 h-12 mx-auto text-muted-foreground" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: "No delivery orders yet" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Start shopping to place your first order." }),
          /* @__PURE__ */ jsx(Link, { to: "/shop", children: /* @__PURE__ */ jsx(Button, { className: "mt-4", children: "Start Shopping" }) })
        ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: orders.map((order) => /* @__PURE__ */ jsx(Link, { to: `/order-confirmation/${order.id}`, className: "block p-4 border rounded-lg hover:bg-muted/30 transition-colors", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-medium", children: [
                "Order #",
                order.id.substring(0, 6).toUpperCase(),
                "..."
              ] }),
              /* @__PURE__ */ jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`, children: order.status.charAt(0).toUpperCase() + order.status.slice(1) })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              formatDate(order.created_at),
              " • ",
              formatCurrency(order.total)
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 sm:mt-0 text-right", children: /* @__PURE__ */ jsx("p", { className: "font-medium", children: formatCurrency(order.total) }) })
        ] }) }, order.id)) })
      ] }) }) }),
      /* @__PURE__ */ jsx(TabsContent, { value: "grocery-runs", className: "space-y-6", children: /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Your Grocery Runs" }),
          /* @__PURE__ */ jsx(Link, { to: "/store-pickup", children: /* @__PURE__ */ jsx(Button, { children: "Schedule New Run" }) })
        ] }),
        loadingOrders ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-40", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx(
          UpcomingOrders,
          {
            orders: pickupOrders,
            onSendMessage: handleSendMessage
          }
        )
      ] }) }) })
    ] })
  ] });
};
const AdminSummaryCards = ({ pendingCount, processingCount, deliveredCount }) => {
  const cardData = [
    { title: "Pending Orders", count: pendingCount, icon: Package, color: "yellow" },
    { title: "Processing Orders", count: processingCount, icon: ShoppingBag, color: "blue" },
    { title: "Delivered Orders", count: deliveredCount, icon: Users, color: "green" }
  ];
  const colors = {
    yellow: { bg: "bg-yellow-100/50", text: "text-yellow-600" },
    blue: { bg: "bg-blue-100/50", text: "text-blue-600" },
    green: { bg: "bg-green-100/50", text: "text-green-600" }
  };
  return /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-3", children: cardData.map((card, index) => /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3, delay: 0.1 * (index + 1) },
      className: "p-6 border rounded-lg bg-card",
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2 rounded-full ${colors[card.color].bg}`, children: /* @__PURE__ */ jsx(card.icon, { className: `h-6 w-6 ${colors[card.color].text}` }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: card.title }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold", children: card.count })
        ] })
      ] })
    },
    card.title
  )) });
};
const OrderItem = ({ order, onStatusChange, onDeliveryTimeChange }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    }).format(date);
  };
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "order-status-pending";
      case "processing":
        return "order-status-processing";
      case "delivered":
        return "order-status-delivered";
      case "cancelled":
        return "order-status-cancelled";
      default:
        return "";
    }
  };
  const handleStatusChange = (value) => {
    onStatusChange(order.id, value);
  };
  const handleDeliveryTimeChange = (e) => {
    const newDateTime = e.target.value;
    onDeliveryTimeChange(order.id, newDateTime);
  };
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      className: "border rounded-lg overflow-hidden bg-card",
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-4 flex items-center justify-between cursor-pointer",
            onClick: () => setIsExpanded(!isExpanded),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Package, { className: "h-5 w-5 text-primary" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-medium", children: order.id }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: formatDate(order.date) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "hidden md:block", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: order.customer.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: order.customer.email })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "hidden md:block", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: formatCurrency(order.total) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
                    order.items.length,
                    " ",
                    order.items.length === 1 ? "item" : "items"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: `px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`, children: order.status.charAt(0).toUpperCase() + order.status.slice(1) }),
                /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: (e) => e.stopPropagation(), children: isExpanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) })
              ] })
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsx("div", { className: "p-4 border-t bg-muted/30", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold mb-2", children: "Customer Information" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Name:" }),
                " ",
                order.customer.name
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Email:" }),
                " ",
                order.customer.email
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Phone:" }),
                " ",
                order.customer.phone
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Address:" }),
                " ",
                order.customer.address
              ] }),
              order.deliveryNotes && /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Delivery Notes:" }),
                " ",
                order.deliveryNotes
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: `status-${order.id}`, children: "Order Status" }),
                /* @__PURE__ */ jsxs(Select, { defaultValue: order.status, onValueChange: handleStatusChange, children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select status" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "processing", children: "Processing" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "delivered", children: "Delivered" }),
                    /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs(Label, { htmlFor: `delivery-time-${order.id}`, className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Calendar$1, { className: "h-4 w-4" }),
                  "Expected Delivery Time"
                ] }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: `delivery-time-${order.id}`,
                    type: "datetime-local",
                    value: order.expected_delivery_at ? new Date(order.expected_delivery_at).toISOString().slice(0, 16) : "",
                    onChange: handleDeliveryTimeChange,
                    className: "mt-1"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold mb-2", children: "Order Items" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: order.items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between p-2 rounded bg-background", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: item.name }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
                    "x",
                    item.quantity
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: formatCurrency(item.price * item.quantity) })
              ] }, index)) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Total" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatCurrency(order.total) })
              ] })
            ] })
          ] })
        ] }) })
      ]
    }
  );
};
const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    fetchOrders();
  }, []);
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load orders." });
    } finally {
      setLoading(false);
    }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      toast$1({ title: "Status Updated", description: `Order status changed to ${status}` });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not update order status." });
    }
  };
  const updateDeliveryTime = async (orderId, expectedDeliveryAt) => {
    try {
      const { error } = await supabase.from("orders").update({ expected_delivery_at: expectedDeliveryAt }).eq("id", orderId);
      if (error) throw error;
      toast$1({ title: "Delivery Time Updated", description: "Expected delivery time has been updated" });
      fetchOrders();
    } catch (error) {
      console.error("Error updating delivery time:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not update delivery time." });
    }
  };
  const filteredOrders = orders.filter((order) => {
    var _a, _b;
    const matchesSearch = ((_a = order.customer_name) == null ? void 0 : _a.toLowerCase().includes(searchTerm.toLowerCase())) || ((_b = order.customer_email) == null ? void 0 : _b.toLowerCase().includes(searchTerm.toLowerCase())) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Orders Management" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "search",
                  placeholder: "Search orders...",
                  className: "pl-8 w-full md:w-[200px]",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by status" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Orders" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "processing", children: "Processing" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "delivered", children: "Delivered" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                className: "md:w-auto",
                onClick: () => {
                  setSearchTerm("");
                  setStatusFilter("all");
                },
                children: "Reset Filters"
              }
            )
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: filteredOrders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 border rounded-lg", children: [
          /* @__PURE__ */ jsx(Package, { className: "w-12 h-12 mx-auto text-muted-foreground" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium", children: "No orders found" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Try adjusting your filters." })
        ] }) : filteredOrders.map((order) => /* @__PURE__ */ jsx(
          OrderItem,
          {
            order: {
              id: order.id,
              date: order.created_at,
              customer: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone,
                address: order.customer_address
              },
              items: order.items,
              total: order.total,
              status: order.status,
              deliveryNotes: order.delivery_notes,
              expected_delivery_at: order.expected_delivery_at
            },
            onStatusChange: updateOrderStatus,
            onDeliveryTimeChange: updateDeliveryTime
          },
          order.id
        )) })
      ]
    }
  );
};
const Table = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tfoot",
  {
    ref,
    className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
const useSupabaseStorage = (bucketName = "groceroo_images") => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const uploadFile = async (file, folderPath = "") => {
    if (!file) return { url: null, error: null };
    setIsUploading(true);
    setUploadError(null);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    try {
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file);
      if (error) {
        throw error;
      }
      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      setIsUploading(false);
      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      setUploadError(error.message);
      toast$1({ variant: "destructive", title: "Upload Failed", description: error.message });
      setIsUploading(false);
      return { url: null, error: error.message };
    }
  };
  const deleteFile = async (fileUrl) => {
    if (!fileUrl) return { success: true, error: null };
    const urlParts = fileUrl.split("/");
    const bucketIndex = urlParts.findIndex((part) => part === bucketName);
    if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
      console.warn("Could not parse file path from URL:", fileUrl);
      return { success: false, error: "Could not parse file path" };
    }
    const filePath = urlParts.slice(bucketIndex + 1).join("/");
    if (!filePath) {
      console.warn("Empty file path extracted from URL:", fileUrl);
      return { success: false, error: "Empty file path" };
    }
    try {
      const { error } = await supabase.storage.from(bucketName).remove([filePath]);
      if (error) {
        throw error;
      }
      console.log(`Successfully deleted file ${filePath} from ${bucketName}.`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      toast$1({ variant: "destructive", title: "Deletion Error", description: `Could not delete file: ${error.message}` });
      return { success: false, error: error.message };
    }
  };
  return { isUploading, uploadError, uploadFile, deleteFile };
};
const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "",
    category_id: "",
    description: "",
    image_url: "",
    in_stock: true,
    featured: false,
    categories_ids: []
  });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const { isUploading, uploadFile, deleteFile } = useSupabaseStorage();
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price || "",
        unit: product.unit || "",
        category_id: product.category_id ? String(product.category_id) : "",
        description: product.description || "",
        image_url: product.image_url || "",
        in_stock: product.in_stock !== void 0 ? product.in_stock : true,
        featured: product.featured !== void 0 ? product.featured : false,
        categories_ids: product.categories_ids || []
      });
      setPreviewUrl(product.image_url || "");
    } else {
      setFormData({
        name: "",
        price: "",
        unit: "",
        category_id: "",
        description: "",
        image_url: "",
        in_stock: true,
        featured: false,
        categories_ids: []
      });
      setPreviewUrl("");
      setSelectedFile(null);
    }
  }, [product]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image_url: "" }));
    }
  };
  const handleImageProcessing = async () => {
    let finalImageUrl = formData.image_url || null;
    if (selectedFile) {
      if (product && product.image_url) {
        await deleteFile(product.image_url);
      }
      const { url, error } = await uploadFile(selectedFile, "products");
      if (error) {
        setErrors((prev) => ({ ...prev, image_url: "Image upload failed. Please try again." }));
        return null;
      }
      finalImageUrl = url;
    }
    return finalImageUrl;
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required";
    if (!formData.category_id) newErrors.category_id = "Category is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;
    const finalImageUrl = await handleImageProcessing();
    if (selectedFile && finalImageUrl === null) {
      toast$1({ variant: "destructive", title: "Submission Failed", description: "Product could not be saved due to image upload error." });
      return;
    }
    const submissionData = {
      name: formData.name,
      price: parseFloat(formData.price),
      unit: formData.unit,
      category_id: parseInt(formData.category_id),
      description: formData.description,
      image_url: finalImageUrl,
      // Use the processed image URL
      in_stock: formData.in_stock,
      featured: formData.featured,
      updated_at: /* @__PURE__ */ new Date(),
      categories_ids: formData.categories_ids
    };
    if (product == null ? void 0 : product.id) {
      submissionData.id = product.id;
    }
    onSubmit(submissionData);
  };
  const handleMultiSelectChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setFormData((prev) => ({
      ...prev,
      categories_ids: options.map((opt) => parseInt(opt.value))
    }));
    if (errors.categories_ids) setErrors((prev) => ({ ...prev, categories_ids: "" }));
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "product-image", children: "Product Image" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 border rounded-md flex items-center justify-center bg-muted overflow-hidden", children: previewUrl ? /* @__PURE__ */ jsx("img", { src: previewUrl, alt: "Product Preview", className: "object-cover w-full h-full" }) : /* @__PURE__ */ jsx(Image$1, { className: "w-10 h-10 text-muted-foreground" }) }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "product-image",
            type: "file",
            accept: "image/*",
            onChange: handleFileChange,
            ref: fileInputRef,
            className: "hidden",
            disabled: isUploading
          }
        ),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => {
          var _a;
          return (_a = fileInputRef.current) == null ? void 0 : _a.click();
        }, disabled: isUploading, children: [
          /* @__PURE__ */ jsx(UploadCloud, { className: "w-4 h-4 mr-2" }),
          isUploading ? "Uploading..." : selectedFile ? "Change Image" : "Upload Image"
        ] })
      ] }),
      errors.image_url && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.image_url })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Product Name" }),
        /* @__PURE__ */ jsx(Input, { id: "name", name: "name", value: formData.name, onChange: handleChange, className: errors.name ? "border-destructive" : "", disabled: isUploading }),
        errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "price", children: "Price" }),
        /* @__PURE__ */ jsx(Input, { id: "price", name: "price", type: "number", step: "0.01", value: formData.price, onChange: handleChange, className: errors.price ? "border-destructive" : "", disabled: isUploading }),
        errors.price && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.price })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "unit", children: "Unit (e.g., lb, bunch, each)" }),
        /* @__PURE__ */ jsx(Input, { id: "unit", name: "unit", value: formData.unit, onChange: handleChange, className: errors.unit ? "border-destructive" : "", disabled: isUploading }),
        errors.unit && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.unit })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "category_id", children: "Category" }),
        /* @__PURE__ */ jsxs(Select, { value: formData.category_id, onValueChange: (value) => handleSelectChange("category_id", value), disabled: isUploading, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: errors.category_id ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select category" }) }),
          /* @__PURE__ */ jsx(SelectContent, { children: categories.map((cat) => /* @__PURE__ */ jsx(SelectItem, { value: String(cat.id), children: cat.name }, cat.id)) })
        ] }),
        errors.category_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.category_id })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "categories_ids", children: "Other Categories" }),
      /* @__PURE__ */ jsx(
        "select",
        {
          id: "categories_ids",
          name: "categories_ids",
          multiple: true,
          value: formData.categories_ids.map(String),
          onChange: handleMultiSelectChange,
          className: "w-full border rounded p-2 min-h-[40px]",
          disabled: isUploading,
          children: categories.filter((cat) => String(cat.id) !== formData.category_id).map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, children: cat.name }, cat.id))
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: "Description" }),
      /* @__PURE__ */ jsx(Textarea, { id: "description", name: "description", value: formData.description, onChange: handleChange, className: errors.description ? "border-destructive" : "", disabled: isUploading }),
      errors.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.description })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx(Checkbox, { id: "in_stock", name: "in_stock", checked: formData.in_stock, onCheckedChange: (checked) => handleSelectChange("in_stock", checked), disabled: isUploading }),
        /* @__PURE__ */ jsx(Label, { htmlFor: "in_stock", children: "In Stock" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsx(Checkbox, { id: "featured", name: "featured", checked: formData.featured, onCheckedChange: (checked) => handleSelectChange("featured", checked), disabled: isUploading }),
        /* @__PURE__ */ jsx(Label, { htmlFor: "featured", children: "Featured Product" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isUploading, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isUploading, children: isUploading ? "Saving..." : product ? "Save Changes" : "Add Product" })
    ] })
  ] });
};
const AdminProductsTab = ({ openDeleteDialog }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setisUploading] = useState(false);
  const fetchProductsAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase.from("products").select("*, categories(id, name)").order("name", { ascending: true });
      if (productsError) throw productsError;
      setProducts(productsData || []);
      const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching products or categories:", error);
      toast$1({ variant: "destructive", title: "Fetch Error", description: "Could not load products or categories." });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (product) => {
          var _a, _b;
          return product.name.toLowerCase().includes(term) || ((_a = product.description) == null ? void 0 : _a.toLowerCase().includes(term)) || ((_b = product.categories) == null ? void 0 : _b.name.toLowerCase().includes(term));
        }
        // Search category name
      );
    }
    return result;
  }, [products, searchTerm]);
  const handleProductSubmit = async (productData) => {
    setLoading(true);
    try {
      let result;
      if (editingProduct) {
        const { data, error } = await supabase.from("products").update({
          ...productData,
          category_id: productData.category_id,
          // Ensure category_id is passed
          categories_ids: productData.categories_ids || [],
          // Pass categories_ids array
          updated_at: /* @__PURE__ */ new Date()
          // Ensure updated_at is set
        }).eq("id", editingProduct.id).select("*, categories(id, name)").single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Product Updated", description: `${result.name} has been updated.` });
      } else {
        const { data, error } = await supabase.from("products").insert({
          ...productData,
          category_id: productData.category_id,
          categories_ids: productData.categories_ids || []
          // Pass categories_ids array
        }).select("*, categories(id, name)").single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Product Added", description: `${result.name} has been added.` });
      }
      fetchProductsAndCategories();
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast$1({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  const triggerDelete = (productId) => {
    const productToDelete = products.find((p) => p.id === productId);
    if (productToDelete) {
      openDeleteDialog("product", productId, productToDelete.image_url);
    }
  };
  const fileInputRef = useRef(null);
  const triggerFileUpload = async (event) => {
    setisUploading(true);
    fileInputRef.current.click();
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    if (file.type !== "text/csv") {
      console.error("Please upload a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) {
        console.warn("CSV file is empty.");
        return;
      }
      const products2 = lines.slice(1).map((line) => {
        const [name, price, description, stock] = line.split(",");
        return {
          name: name ? name.trim() : "",
          price: price ? parseFloat(price.trim()) : 0,
          // Convert price to number
          description: description ? description.trim() : "",
          stock: stock ? parseInt(stock.trim(), 10) : 0
          // Convert stock to integer
        };
      }).filter((product) => product.name);
      console.log("Parsed Products:", products2);
      if (products2.length === 0) {
        console.warn("No valid product data found in CSV.");
        return;
      }
      try {
        const { data, error } = await supabase.from("products").insert(products2);
        if (error) {
          console.error("Error inserting data into Supabase:", error);
        } else {
          console.log("Bulk upload successful to Supabase:", data);
        }
      } catch (error) {
        console.error("Unexpected error during Supabase insert:", error);
      }
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
    };
    reader.readAsText(file);
  };
  return /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Products Management" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { type: "search", placeholder: "Search products...", className: "pl-8 w-full md:w-[200px]", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: (isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) setEditingProduct(null);
        }, children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: () => setEditingProduct(null), children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "w-4 h-4 mr-2" }),
            " Add Product"
          ] }) }),
          /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [
            /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingProduct ? "Edit Product" : "Add New Product" }) }),
            /* @__PURE__ */ jsx(
              ProductForm,
              {
                product: editingProduct,
                categories,
                onSubmit: handleProductSubmit,
                onCancel: () => setIsDialogOpen(false)
              },
              editingProduct ? editingProduct.id : "new"
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: triggerFileUpload, disabled: isUploading, children: isUploading ? "Uploading..." : "Upload CSV" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            ref: fileInputRef,
            accept: ".csv",
            onChange: handleFileUpload,
            style: { display: "none" }
          }
        )
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]", children: "Image" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Category" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Price" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Stock" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Featured" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filteredProducts.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "h-24 text-center", children: "No products found." }) }) : filteredProducts.map((product) => {
        var _a;
        return /* @__PURE__ */ jsxs(TableRow, { children: [
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden", children: product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: product.name, className: "object-cover w-full h-full" }) : /* @__PURE__ */ jsx(Image$1, { className: "w-6 h-6 text-muted-foreground" }) }) }),
          /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: product.name }),
          /* @__PURE__ */ jsx(TableCell, { children: ((_a = product.categories) == null ? void 0 : _a.name) || "N/A" }),
          /* @__PURE__ */ jsx(TableCell, { children: formatCurrency(product.price) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: product.in_stock ? "default" : "destructive", className: `whitespace-nowrap ${product.in_stock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: product.in_stock ? "In Stock" : "Out" }) }),
          /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Checkbox, { checked: product.featured, disabled: true, className: "cursor-default" }) }),
          /* @__PURE__ */ jsxs(TableCell, { className: "text-right", children: [
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
              setEditingProduct(product);
              setIsDialogOpen(true);
            }, children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "text-destructive hover:text-destructive", onClick: () => triggerDelete(product.id), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }, product.id);
      }) })
    ] }) })
  ] });
};
const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({ name: "", description: "", image_url: "" });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const { isUploading, uploadFile, deleteFile } = useSupabaseStorage();
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        image_url: category.image_url || ""
      });
      setPreviewUrl(category.image_url || "");
    } else {
      setFormData({ name: "", description: "", image_url: "" });
      setPreviewUrl("");
      setSelectedFile(null);
    }
  }, [category]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, image_url: "" }));
    }
  };
  const handleImageProcessing = async () => {
    let finalImageUrl = formData.image_url || null;
    if (selectedFile) {
      if (category && category.image_url) {
        await deleteFile(category.image_url);
      }
      const { url, error } = await uploadFile(selectedFile, "categories");
      if (error) {
        setErrors((prev) => ({ ...prev, image_url: "Image upload failed." }));
        return null;
      }
      finalImageUrl = url;
    }
    return finalImageUrl;
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;
    const finalImageUrl = await handleImageProcessing();
    if (selectedFile && finalImageUrl === null) {
      toast$1({ variant: "destructive", title: "Submission Failed", description: "Category could not be saved due to image upload error." });
      return;
    }
    const submissionData = {
      name: formData.name,
      description: formData.description,
      image_url: finalImageUrl,
      updated_at: /* @__PURE__ */ new Date()
    };
    if (category == null ? void 0 : category.id) {
      submissionData.id = category.id;
    }
    onSubmit(submissionData);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "category-image", children: "Category Image" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-24 h-24 border rounded-md flex items-center justify-center bg-muted overflow-hidden", children: previewUrl ? /* @__PURE__ */ jsx("img", { src: previewUrl, alt: "Category Preview", className: "object-cover w-full h-full" }) : /* @__PURE__ */ jsx(Image$1, { className: "w-10 h-10 text-muted-foreground" }) }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "category-image",
            type: "file",
            accept: "image/*",
            onChange: handleFileChange,
            ref: fileInputRef,
            className: "hidden",
            disabled: isUploading
          }
        ),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", onClick: () => {
          var _a;
          return (_a = fileInputRef.current) == null ? void 0 : _a.click();
        }, disabled: isUploading, children: [
          /* @__PURE__ */ jsx(UploadCloud, { className: "w-4 h-4 mr-2" }),
          isUploading ? "Uploading..." : selectedFile ? "Change Image" : "Upload Image"
        ] })
      ] }),
      errors.image_url && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.image_url })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Category Name" }),
      /* @__PURE__ */ jsx(Input, { id: "name", name: "name", value: formData.name, onChange: handleChange, className: errors.name ? "border-destructive" : "", disabled: isUploading }),
      errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "description", children: "Description" }),
      /* @__PURE__ */ jsx(Textarea, { id: "description", name: "description", value: formData.description, onChange: handleChange, className: errors.description ? "border-destructive" : "", disabled: isUploading }),
      errors.description && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.description })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isUploading, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isUploading, children: isUploading ? "Saving..." : category ? "Save Changes" : "Add Category" })
    ] })
  ] });
};
const AdminCategoriesTab = ({ openDeleteDialog }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast$1({ variant: "destructive", title: "Fetch Error", description: "Could not load categories." });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  const filteredCategories = useMemo(() => {
    let result = [...categories];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (category) => {
          var _a;
          return category.name.toLowerCase().includes(term) || ((_a = category.description) == null ? void 0 : _a.toLowerCase().includes(term));
        }
      );
    }
    return result;
  }, [categories, searchTerm]);
  const handleCategorySubmit = async (categoryData) => {
    setLoading(true);
    try {
      let result;
      if (editingCategory) {
        const { data, error } = await supabase.from("categories").update(categoryData).eq("id", editingCategory.id).select().single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Category Updated", description: `${result.name} has been updated.` });
      } else {
        const { data, error } = await supabase.from("categories").insert(categoryData).select().single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Category Added", description: `${result.name} has been added.` });
      }
      fetchCategories();
      setIsDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error("Error saving category:", error);
      toast$1({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  const triggerDelete = (categoryId) => {
    const categoryToDelete = categories.find((c) => c.id === categoryId);
    if (categoryToDelete) {
      openDeleteDialog("category", categoryId, categoryToDelete.image_url);
    }
  };
  return /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Categories Management" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx(Input, { type: "search", placeholder: "Search categories...", className: "pl-8 w-full md:w-[200px]", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: (isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) setEditingCategory(null);
        }, children: [
          /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: () => setEditingCategory(null), children: [
            /* @__PURE__ */ jsx(PlusCircle, { className: "w-4 h-4 mr-2" }),
            " Add Category"
          ] }) }),
          /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [
            /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingCategory ? "Edit Category" : "Add New Category" }) }),
            /* @__PURE__ */ jsx(
              CategoryForm,
              {
                category: editingCategory,
                onSubmit: handleCategorySubmit,
                onCancel: () => setIsDialogOpen(false)
              },
              editingCategory ? editingCategory.id : "new"
            )
          ] })
        ] })
      ] })
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]", children: "Image" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Description" }),
        /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: filteredCategories.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 4, className: "h-24 text-center", children: "No categories found." }) }) : filteredCategories.map((category) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden", children: category.image_url ? /* @__PURE__ */ jsx("img", { src: category.image_url, alt: category.name, className: "object-cover w-full h-full" }) : /* @__PURE__ */ jsx(Image$1, { className: "w-6 h-6 text-muted-foreground" }) }) }),
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: category.name }),
        /* @__PURE__ */ jsx(TableCell, { className: "text-sm text-muted-foreground truncate max-w-xs", children: category.description }),
        /* @__PURE__ */ jsxs(TableCell, { className: "text-right", children: [
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
            setEditingCategory(category);
            setIsDialogOpen(true);
          }, children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "text-destructive hover:text-destructive", onClick: () => triggerDelete(category.id), children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, category.id)) })
    ] }) })
  ] });
};
const DeliverySettingsForm = () => {
  const [settings, setSettings] = useState({
    express_fee: "",
    scheduled_fee: "",
    late_fee: "",
    timezone: "Australia/Adelaide",
    estimated_delivery_minutes: 45
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const timezoneOptions = [
    { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
    { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
    { value: "Australia/Brisbane", label: "Brisbane (AEST)" },
    { value: "Australia/Perth", label: "Perth (AWST)" },
    { value: "Australia/Darwin", label: "Darwin (ACST)" }
  ];
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("delivery_settings").select("*").eq("id", 1).single();
        if (error && error.code !== "PGRST116") {
          throw error;
        }
        if (data) {
          setSettings({
            express_fee: data.express_fee || "",
            scheduled_fee: data.scheduled_fee || "",
            late_fee: data.late_fee || "",
            timezone: data.timezone || "Australia/Adelaide",
            estimated_delivery_minutes: data.estimated_delivery_minutes || 45
          });
        } else {
          setSettings({
            express_fee: "9.99",
            scheduled_fee: "5.99",
            late_fee: "7.99",
            timezone: "Australia/Adelaide",
            estimated_delivery_minutes: 45
          });
        }
      } catch (error) {
        console.error("Error fetching delivery settings:", error);
        toast$1({ variant: "destructive", title: "Fetch Error", description: "Could not load delivery settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleSelectChange = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    const validateFee = (fee, name) => {
      if (!fee || isNaN(fee) || parseFloat(fee) < 0) {
        newErrors[name] = "Valid non-negative fee is required";
      }
    };
    validateFee(settings.express_fee, "express_fee");
    validateFee(settings.scheduled_fee, "scheduled_fee");
    validateFee(settings.late_fee, "late_fee");
    if (!settings.estimated_delivery_minutes || isNaN(settings.estimated_delivery_minutes) || parseInt(settings.estimated_delivery_minutes) <= 0) {
      newErrors.estimated_delivery_minutes = "Valid delivery time is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;
    setIsSaving(true);
    try {
      const updateData = {
        id: 1,
        express_fee: parseFloat(settings.express_fee),
        scheduled_fee: parseFloat(settings.scheduled_fee),
        late_fee: parseFloat(settings.late_fee),
        timezone: settings.timezone,
        estimated_delivery_minutes: parseInt(settings.estimated_delivery_minutes),
        updated_at: /* @__PURE__ */ new Date()
      };
      const { error } = await supabase.from("delivery_settings").upsert(updateData, { onConflict: "id" });
      if (error) throw error;
      toast$1({ title: "Settings Updated", description: "Delivery settings have been saved." });
    } catch (error) {
      console.error("Error saving delivery settings:", error);
      toast$1({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-40", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "express_fee", children: "Express Delivery Fee ($)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "express_fee",
          name: "express_fee",
          type: "number",
          step: "0.01",
          value: settings.express_fee,
          onChange: handleChange,
          className: errors.express_fee ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.express_fee && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.express_fee })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "scheduled_fee", children: "Scheduled Delivery Fee ($)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "scheduled_fee",
          name: "scheduled_fee",
          type: "number",
          step: "0.01",
          value: settings.scheduled_fee,
          onChange: handleChange,
          className: errors.scheduled_fee ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.scheduled_fee && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.scheduled_fee })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "late_fee", children: "Late Delivery Fee ($)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "late_fee",
          name: "late_fee",
          type: "number",
          step: "0.01",
          value: settings.late_fee,
          onChange: handleChange,
          className: errors.late_fee ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.late_fee && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.late_fee }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Fee applied for orders scheduled outside standard hours." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "timezone", children: "Timezone" }),
      /* @__PURE__ */ jsxs(
        Select,
        {
          value: settings.timezone,
          onValueChange: (value) => handleSelectChange("timezone", value),
          disabled: isSaving,
          children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: errors.timezone ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select timezone" }) }),
            /* @__PURE__ */ jsx(SelectContent, { children: timezoneOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
          ]
        }
      ),
      errors.timezone && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.timezone })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "estimated_delivery_minutes", children: "Estimated Delivery Time (minutes)" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "estimated_delivery_minutes",
          name: "estimated_delivery_minutes",
          type: "number",
          min: "1",
          value: settings.estimated_delivery_minutes,
          onChange: handleChange,
          className: errors.estimated_delivery_minutes ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.estimated_delivery_minutes && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.estimated_delivery_minutes }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: 'This will be displayed on the homepage as "Delivering in: X minutes (approx.)"' })
    ] }),
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSaving, children: isSaving ? "Saving..." : "Save Settings" })
  ] });
};
const StripeSettingsForm = () => {
  const [settings, setSettings] = useState({ publishable_key: "", price_id: "", openai_key: "" });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [{ data: stripeData }, { data: openaiData }] = await Promise.all([
          supabase.from("stripe_settings").select("publishable_key, price_id").eq("id", 1).single(),
          supabase.from("openai_settings").select("api_key").eq("id", 1).single()
        ]);
        setSettings({
          publishable_key: (stripeData == null ? void 0 : stripeData.publishable_key) || "",
          price_id: (stripeData == null ? void 0 : stripeData.price_id) || "",
          openai_key: (openaiData == null ? void 0 : openaiData.api_key) || ""
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast$1({ variant: "destructive", title: "Fetch Error", description: "Could not load settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!settings.publishable_key.trim()) {
      newErrors.publishable_key = "Stripe Publishable Key is required.";
    } else if (!settings.publishable_key.startsWith("pk_")) {
      newErrors.publishable_key = 'Invalid Publishable Key format. Should start with "pk_".';
    }
    if (!settings.price_id.trim()) {
      newErrors.price_id = "Stripe Price ID is required.";
    } else if (!settings.price_id.startsWith("price_")) {
      newErrors.price_id = 'Invalid Price ID format. Should start with "price_".';
    }
    if (!settings.openai_key.trim()) {
      newErrors.openai_key = "OpenAI API Key is required.";
    } else if (!settings.openai_key.startsWith("sk-")) {
      newErrors.openai_key = 'Invalid OpenAI API Key format. Should start with "sk-".';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;
    setIsSaving(true);
    try {
      const [stripeResult, openaiResult] = await Promise.all([
        supabase.from("stripe_settings").upsert({
          id: 1,
          publishable_key: settings.publishable_key.trim(),
          price_id: settings.price_id.trim(),
          updated_at: /* @__PURE__ */ new Date()
        }, { onConflict: "id" }),
        supabase.from("openai_settings").upsert({
          id: 1,
          api_key: settings.openai_key.trim(),
          updated_at: /* @__PURE__ */ new Date()
        }, { onConflict: "id" })
      ]);
      if (stripeResult.error) throw stripeResult.error;
      if (openaiResult.error) throw openaiResult.error;
      toast$1({ title: "Settings Updated", description: "Your payment and AI settings have been saved." });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast$1({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center h-40", children: /* @__PURE__ */ jsx("div", { className: "w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "publishable_key", children: "Stripe Publishable Key" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "publishable_key",
          name: "publishable_key",
          type: "text",
          value: settings.publishable_key,
          onChange: handleChange,
          placeholder: "pk_live_...",
          className: errors.publishable_key ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.publishable_key && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.publishable_key }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Find this in your Stripe Dashboard under Developers > API Keys." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "price_id", children: "Stripe Default Price ID" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "price_id",
          name: "price_id",
          type: "text",
          value: settings.price_id,
          onChange: handleChange,
          placeholder: "price_...",
          className: errors.price_id ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.price_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.price_id }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "The Price ID for your primary product/service in Stripe." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "openai_key", children: "OpenAI API Key" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "openai_key",
          name: "openai_key",
          type: "password",
          value: settings.openai_key,
          onChange: handleChange,
          placeholder: "sk-...",
          className: errors.openai_key ? "border-destructive" : "",
          disabled: isSaving
        }
      ),
      errors.openai_key && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.openai_key }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Your OpenAI API key for the AI shopping assistant. Find this in your OpenAI dashboard." })
    ] }),
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSaving, children: isSaving ? "Saving..." : "Save Settings" })
  ] });
};
const AdminSettingsTab = () => {
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "space-y-8",
      children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Delivery Settings" }),
          /* @__PURE__ */ jsx("div", { className: "p-6 mt-4 border rounded-lg", children: /* @__PURE__ */ jsx(DeliverySettingsForm, {}) })
        ] }),
        /* @__PURE__ */ jsx(Separator, {}),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Stripe Payment Gateway" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Configure your Stripe account to enable online payments." }),
          /* @__PURE__ */ jsx("div", { className: "p-6 mt-4 border rounded-lg", children: /* @__PURE__ */ jsx(StripeSettingsForm, {}) })
        ] })
      ]
    }
  );
};
const StoreForm = ({ store, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    opening_time: "09:00",
    closing_time: "21:00"
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    var _a, _b;
    if (store) {
      setFormData({
        name: store.name || "",
        address: store.address || "",
        phone: store.phone || "",
        opening_time: ((_a = store.opening_time) == null ? void 0 : _a.slice(0, 5)) || "09:00",
        closing_time: ((_b = store.closing_time) == null ? void 0 : _b.slice(0, 5)) || "21:00"
      });
    }
  }, [store]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.opening_time) newErrors.opening_time = "Opening time is required";
    if (!formData.closing_time) newErrors.closing_time = "Closing time is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Store Name" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "name",
          name: "name",
          value: formData.name,
          onChange: handleChange,
          className: errors.name ? "border-destructive" : "",
          disabled: isSubmitting
        }
      ),
      errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.name })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Address" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "address",
          name: "address",
          value: formData.address,
          onChange: handleChange,
          className: errors.address ? "border-destructive" : "",
          disabled: isSubmitting
        }
      ),
      errors.address && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.address })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
      /* @__PURE__ */ jsx(
        Input,
        {
          id: "phone",
          name: "phone",
          value: formData.phone,
          onChange: handleChange,
          className: errors.phone ? "border-destructive" : "",
          disabled: isSubmitting
        }
      ),
      errors.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.phone })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "opening_time", children: "Opening Time" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "opening_time",
            name: "opening_time",
            type: "time",
            value: formData.opening_time,
            onChange: handleChange,
            className: errors.opening_time ? "border-destructive" : "",
            disabled: isSubmitting
          }
        ),
        errors.opening_time && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.opening_time })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "closing_time", children: "Closing Time" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "closing_time",
            name: "closing_time",
            type: "time",
            value: formData.closing_time,
            onChange: handleChange,
            className: errors.closing_time ? "border-destructive" : "",
            disabled: isSubmitting
          }
        ),
        errors.closing_time && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.closing_time })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isSubmitting, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Saving..." : store ? "Update Store" : "Add Store" })
    ] })
  ] });
};
const AdminStoresTab = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load stores." });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchStores();
  }, []);
  const handleStoreSubmit = async (storeData) => {
    try {
      if (editingStore) {
        const { error } = await supabase.from("stores").update(storeData).eq("id", editingStore.id);
        if (error) throw error;
        toast$1({ title: "Store Updated", description: `${storeData.name} has been updated.` });
      } else {
        const { error } = await supabase.from("stores").insert(storeData);
        if (error) throw error;
        toast$1({ title: "Store Added", description: `${storeData.name} has been added.` });
      }
      setIsDialogOpen(false);
      setEditingStore(null);
      fetchStores();
    } catch (error) {
      console.error("Error saving store:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not save store." });
    }
  };
  const handleDeleteStore = async (storeId) => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;
    try {
      const { error } = await supabase.from("stores").delete().eq("id", storeId);
      if (error) throw error;
      toast$1({ title: "Store Deleted", description: "Store has been removed." });
      fetchStores();
    } catch (error) {
      console.error("Error deleting store:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not delete store." });
    }
  };
  const filteredStores = stores.filter(
    (store) => store.name.toLowerCase().includes(searchTerm.toLowerCase()) || store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Store Management" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "search",
                  placeholder: "Search stores...",
                  className: "pl-8 w-full md:w-[200px]",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
              /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: () => setEditingStore(null), children: [
                /* @__PURE__ */ jsx(PlusCircle, { className: "w-4 h-4 mr-2" }),
                " Add Store"
              ] }) }),
              /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [
                /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingStore ? "Edit Store" : "Add New Store" }) }),
                /* @__PURE__ */ jsx(
                  StoreForm,
                  {
                    store: editingStore,
                    onSubmit: handleStoreSubmit,
                    onCancel: () => setIsDialogOpen(false)
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Address" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Phone" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Hours" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: filteredStores.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 5, className: "h-24 text-center", children: "No stores found." }) }) : filteredStores.map((store) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: store.name }),
            /* @__PURE__ */ jsx(TableCell, { children: store.address }),
            /* @__PURE__ */ jsx(TableCell, { children: store.phone }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { children: [
                store.opening_time.slice(0, 5),
                " - ",
                store.closing_time.slice(0, 5)
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-right", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => {
                    setEditingStore(store);
                    setIsDialogOpen(true);
                  },
                  children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "text-destructive hover:text-destructive",
                  onClick: () => handleDeleteStore(store.id),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }, store.id)) })
        ] }) })
      ]
    }
  );
};
const AdminPickupOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [actualAmount, setActualAmount] = useState("");
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from("pickup_orders").select(`
          *,
          profiles:user_id (name, phone),
          pickup_order_stores (
            id,
            store_id,
            estimated_total,
            actual_total,
            notes,
            status,
            stores (name, address)
          )
        `).order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching pickup orders:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load pickup orders." });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);
  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase.from("pickup_orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      toast$1({ title: "Status Updated", description: `Order status changed to ${status}` });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not update order status." });
    }
  };
  const updateStoreOrderStatus = async (storeOrderId, status) => {
    try {
      const { error } = await supabase.from("pickup_order_stores").update({ status }).eq("id", storeOrderId);
      if (error) throw error;
      toast$1({ title: "Store Status Updated", description: `Store order status changed to ${status}` });
      fetchOrders();
      if (selectedOrder) {
        const updatedOrder = orders.find((o) => o.id === selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error updating store order status:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not update store order status." });
    }
  };
  const confirmPaymentWithActualAmount = async () => {
    if (!actualAmount || !selectedOrder) return;
    setConfirmingPayment(true);
    try {
      const response = await fetch("https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/confirm-pickup-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY"
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          actualAmount: parseFloat(actualAmount)
        })
      });
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }
      const { error: updateError } = await supabase.from("pickup_orders").update({
        actual_total: parseFloat(actualAmount),
        payment_status: "confirmed",
        status: "completed"
      }).eq("id", selectedOrder.id);
      if (updateError) throw updateError;
      toast$1({
        title: "Payment Confirmed",
        description: `Payment confirmed with actual amount ${formatCurrency(parseFloat(actualAmount))}`
      });
      setActualAmount("");
      fetchOrders();
      setSelectedOrder({
        ...selectedOrder,
        actual_total: parseFloat(actualAmount),
        payment_status: "confirmed",
        status: "completed"
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast$1({
        variant: "destructive",
        title: "Error",
        description: "Could not confirm payment: " + error.message
      });
    } finally {
      setConfirmingPayment(false);
    }
  };
  const sendAdminMessage = async () => {
    if (!adminMessage.trim() || !selectedOrder) return;
    try {
      const currentMessages = selectedOrder.admin_messages || [];
      const newMessage = {
        from: "admin",
        message: adminMessage,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("pickup_orders").update({
        admin_messages: [...currentMessages, newMessage]
      }).eq("id", selectedOrder.id);
      if (error) throw error;
      toast$1({ title: "Message Sent", description: "Your message has been sent to the customer." });
      setAdminMessage("");
      fetchOrders();
      setSelectedOrder({
        ...selectedOrder,
        admin_messages: [...currentMessages, newMessage]
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };
  const openWhatsApp = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };
  const filteredOrders = orders.filter((order) => {
    var _a, _b, _c, _d;
    const matchesSearch = ((_b = (_a = order.profiles) == null ? void 0 : _a.name) == null ? void 0 : _b.toLowerCase().includes(searchTerm.toLowerCase())) || ((_c = order.whatsapp_number) == null ? void 0 : _c.includes(searchTerm)) || ((_d = order.phone_number) == null ? void 0 : _d.includes(searchTerm)) || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Multi-Store Pickup Orders" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "search",
                  placeholder: "Search orders...",
                  className: "pl-8 w-full md:w-[200px]",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[180px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by status" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Orders" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "confirmed", children: "Confirmed" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "processing", children: "Processing" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "ready", children: "Ready" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
              ] })
            ] })
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Order ID" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Customer" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Stores" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Date & Time" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Contact" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Payment" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Total" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: filteredOrders.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 9, className: "h-24 text-center", children: "No orders found." }) }) : filteredOrders.map((order) => {
            var _a, _b, _c, _d, _e;
            return /* @__PURE__ */ jsxs(TableRow, { children: [
              /* @__PURE__ */ jsxs(TableCell, { className: "font-medium", children: [
                order.id.slice(0, 6),
                "..."
              ] }),
              /* @__PURE__ */ jsx(TableCell, { children: ((_a = order.profiles) == null ? void 0 : _a.name) || "N/A" }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: (_b = order.pickup_order_stores) == null ? void 0 : _b.map((storeOrder, index) => {
                var _a2;
                return /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: (_a2 = storeOrder.stores) == null ? void 0 : _a2.name }, index);
              }) }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                  /* @__PURE__ */ jsx(Calendar$1, { className: "w-3 h-3 mr-1" }),
                  order.pickup_date ? format(new Date(order.pickup_date), "MMM d") : "N/A"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: order.time_slot })
              ] }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                order.whatsapp_number && /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-6 px-2 text-xs",
                    onClick: () => openWhatsApp(order.whatsapp_number),
                    children: [
                      /* @__PURE__ */ jsx(MessageCircle, { className: "w-3 h-3 mr-1" }),
                      "WhatsApp"
                    ]
                  }
                ),
                order.phone_number && /* @__PURE__ */ jsxs(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "h-6 px-2 text-xs",
                    onClick: () => window.open(`tel:${order.phone_number}`),
                    children: [
                      /* @__PURE__ */ jsx(Phone, { className: "w-3 h-3 mr-1" }),
                      "Call"
                    ]
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(
                Select,
                {
                  value: order.status,
                  onValueChange: (value) => updateOrderStatus(order.id, value),
                  children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[130px]", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "confirmed", children: "Confirmed" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "processing", children: "Processing" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "ready", children: "Ready" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" }),
                      /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
                    ] })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { className: getPaymentStatusColor(order.payment_status), children: order.payment_status }) }),
              /* @__PURE__ */ jsx(TableCell, { children: order.actual_total ? formatCurrency(order.actual_total) : formatCurrency(order.estimated_total || 0) }),
              /* @__PURE__ */ jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxs(Dialog, { open: isDetailDialogOpen, onOpenChange: setIsDetailDialogOpen, children: [
                /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setSelectedOrder(order),
                    children: /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
                  }
                ) }),
                /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [
                  /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
                    "Order Details - ",
                    selectedOrder == null ? void 0 : selectedOrder.id.slice(0, 6),
                    "..."
                  ] }) }),
                  selectedOrder && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Customer Information" }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Name:" }),
                            " ",
                            (_c = selectedOrder.profiles) == null ? void 0 : _c.name
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "WhatsApp:" }),
                            " ",
                            selectedOrder.whatsapp_number || "N/A"
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Phone:" }),
                            " ",
                            selectedOrder.phone_number || "N/A"
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Address:" }),
                            " ",
                            selectedOrder.delivery_address
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Postcode:" }),
                            " ",
                            selectedOrder.postcode
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Order Information" }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm", children: [
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Date:" }),
                            " ",
                            selectedOrder.pickup_date ? format(new Date(selectedOrder.pickup_date), "PPP") : "N/A"
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Time Slot:" }),
                            " ",
                            selectedOrder.time_slot
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Status:" }),
                            /* @__PURE__ */ jsx(Badge, { className: `ml-2 ${getStatusColor(selectedOrder.status)}`, children: selectedOrder.status })
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Payment:" }),
                            /* @__PURE__ */ jsx(Badge, { className: `ml-2 ${getPaymentStatusColor(selectedOrder.payment_status)}`, children: selectedOrder.payment_status })
                          ] }),
                          /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Estimated Total:" }),
                            " ",
                            formatCurrency(selectedOrder.estimated_total || 0)
                          ] }),
                          selectedOrder.actual_total && /* @__PURE__ */ jsxs("p", { children: [
                            /* @__PURE__ */ jsx("strong", { children: "Actual Total:" }),
                            " ",
                            formatCurrency(selectedOrder.actual_total)
                          ] })
                        ] })
                      ] })
                    ] }),
                    selectedOrder.payment_status === "paid" && !selectedOrder.actual_total && /* @__PURE__ */ jsxs("div", { className: "p-4 border rounded-lg bg-blue-50", children: [
                      /* @__PURE__ */ jsxs("h4", { className: "font-semibold mb-2 flex items-center", children: [
                        /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4 mr-2" }),
                        "Confirm Payment with Actual Amount"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex space-x-2 items-end", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsx(Label, { htmlFor: "actual-amount", children: "Actual Total Amount ($)" }),
                          /* @__PURE__ */ jsx(
                            Input,
                            {
                              id: "actual-amount",
                              type: "number",
                              step: "0.01",
                              value: actualAmount,
                              onChange: (e) => setActualAmount(e.target.value),
                              placeholder: "Enter actual total amount"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs(
                          Button,
                          {
                            onClick: confirmPaymentWithActualAmount,
                            disabled: !actualAmount || confirmingPayment,
                            className: "bg-green-600 hover:bg-green-700",
                            children: [
                              confirmingPayment ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }) : /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 mr-2" }),
                              confirmingPayment ? "Confirming..." : "Confirm Payment"
                            ]
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Store Orders" }),
                      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: (_d = selectedOrder.pickup_order_stores) == null ? void 0 : _d.map((storeOrder, index) => {
                        var _a2, _b2;
                        return /* @__PURE__ */ jsxs("div", { className: "border rounded-lg p-4", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                              /* @__PURE__ */ jsx("h5", { className: "font-medium", children: (_a2 = storeOrder.stores) == null ? void 0 : _a2.name }),
                              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: (_b2 = storeOrder.stores) == null ? void 0 : _b2.address })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                              /* @__PURE__ */ jsx("p", { className: "font-medium", children: formatCurrency(storeOrder.estimated_total || 0) }),
                              /* @__PURE__ */ jsxs(
                                Select,
                                {
                                  value: storeOrder.status,
                                  onValueChange: (value) => updateStoreOrderStatus(storeOrder.id, value),
                                  children: [
                                    /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[120px] mt-1", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                                    /* @__PURE__ */ jsxs(SelectContent, { children: [
                                      /* @__PURE__ */ jsx(SelectItem, { value: "pending", children: "Pending" }),
                                      /* @__PURE__ */ jsx(SelectItem, { value: "confirmed", children: "Confirmed" }),
                                      /* @__PURE__ */ jsx(SelectItem, { value: "processing", children: "Processing" }),
                                      /* @__PURE__ */ jsx(SelectItem, { value: "ready", children: "Ready" }),
                                      /* @__PURE__ */ jsx(SelectItem, { value: "completed", children: "Completed" }),
                                      /* @__PURE__ */ jsx(SelectItem, { value: "cancelled", children: "Cancelled" })
                                    ] })
                                  ]
                                }
                              )
                            ] })
                          ] }),
                          storeOrder.notes && /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Shopping List:" }),
                            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground bg-muted p-2 rounded mt-1", children: storeOrder.notes })
                          ] })
                        ] }, index);
                      }) })
                    ] }),
                    selectedOrder.photos && selectedOrder.photos.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Customer Photos" }),
                      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: selectedOrder.photos.map((photo, index) => /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: photo.data,
                          alt: `Photo ${index + 1}`,
                          className: "aspect-square rounded object-cover cursor-pointer",
                          onClick: () => window.open(photo.data, "_blank")
                        },
                        index
                      )) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Messages" }),
                      /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-40 overflow-y-auto mb-4", children: (_e = selectedOrder.admin_messages) == null ? void 0 : _e.map((message, index) => /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className: `p-3 rounded text-sm ${message.from === "admin" ? "bg-blue-50 border-l-4 border-blue-400 ml-4" : "bg-gray-50 border-l-4 border-gray-400 mr-4"}`,
                          children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
                              /* @__PURE__ */ jsx("span", { className: "font-medium", children: message.from === "admin" ? "You" : "Customer" }),
                              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(new Date(message.timestamp), "MMM d, HH:mm") })
                            ] }),
                            /* @__PURE__ */ jsx("p", { children: message.message })
                          ]
                        },
                        index
                      )) }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                        /* @__PURE__ */ jsx(Label, { children: "Send message to customer:" }),
                        /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
                          /* @__PURE__ */ jsx(
                            Textarea,
                            {
                              value: adminMessage,
                              onChange: (e) => setAdminMessage(e.target.value),
                              placeholder: "Type your message...",
                              rows: 2,
                              className: "flex-1"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Button,
                            {
                              onClick: sendAdminMessage,
                              disabled: !adminMessage.trim(),
                              children: "Send"
                            }
                          )
                        ] })
                      ] })
                    ] })
                  ] })
                ] })
              ] }) })
            ] }, order.id);
          }) })
        ] }) })
      ]
    }
  );
};
const TimeSlotForm = ({ timeSlot, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    dates: [getCurrentDateInTimezone()],
    start_time: "09:00",
    end_time: "11:00",
    max_orders: 10,
    slot_type: "delivery",
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const { data, error } = await supabase.from("delivery_settings").select("timezone").eq("id", 1).single();
        if (!error && (data == null ? void 0 : data.timezone)) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error("Error fetching timezone:", error);
      }
    };
    fetchTimezone();
  }, []);
  useEffect(() => {
    if (timeSlot) {
      const slotDate = /* @__PURE__ */ new Date(timeSlot.date + "T12:00:00");
      setFormData({
        dates: [slotDate],
        start_time: timeSlot.start_time.slice(0, 5),
        end_time: timeSlot.end_time.slice(0, 5),
        max_orders: timeSlot.max_orders,
        slot_type: timeSlot.slot_type,
        is_active: timeSlot.is_active
      });
      setBulkMode(false);
    } else {
      setFormData({
        dates: [getCurrentDateInTimezone(timezone)],
        start_time: "09:00",
        end_time: "11:00",
        max_orders: 10,
        slot_type: "delivery",
        is_active: true
      });
      setBulkMode(false);
    }
  }, [timeSlot, timezone]);
  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleDateChange = (date, index) => {
    const newDates = [...formData.dates];
    newDates[index] = date;
    setFormData((prev) => ({ ...prev, dates: newDates }));
    if (errors.dates) {
      setErrors((prev) => ({ ...prev, dates: "" }));
    }
  };
  const addDate = () => {
    const lastDate = formData.dates[formData.dates.length - 1];
    const nextDate = addDays(lastDate, 1);
    setFormData((prev) => ({ ...prev, dates: [...prev.dates, nextDate] }));
  };
  const removeDate = (index) => {
    if (formData.dates.length > 1) {
      const newDates = formData.dates.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, dates: newDates }));
    }
  };
  const addDateRange = () => {
    const startDate = getCurrentDateInTimezone(timezone);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    setFormData((prev) => ({ ...prev, dates }));
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.dates || formData.dates.length === 0) {
      newErrors.dates = "At least one date is required";
    } else {
      const today = getCurrentDateInTimezone(timezone);
      const todayStr = formatDateForTimezone(today, timezone);
      for (const date of formData.dates) {
        const dateStr = formatDateForTimezone(date, timezone);
        if (dateStr < todayStr) {
          newErrors.dates = "Dates cannot be in the past";
          break;
        }
      }
    }
    if (!formData.start_time) {
      newErrors.start_time = "Start time is required";
    }
    if (!formData.end_time) {
      newErrors.end_time = "End time is required";
    }
    if (formData.start_time && formData.end_time) {
      if (!isEndTimeAfterStartTime(formData.start_time, formData.end_time)) {
        newErrors.end_time = "End time must be after start time";
      }
    }
    if (!formData.max_orders || formData.max_orders < 1) {
      newErrors.max_orders = "Maximum orders must be at least 1";
    }
    if (!formData.slot_type) {
      newErrors.slot_type = "Slot type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (timeSlot) {
        const submissionData = {
          date: formatDateForTimezone(formData.dates[0], timezone),
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_orders: parseInt(formData.max_orders),
          slot_type: formData.slot_type,
          is_active: formData.is_active
        };
        await onSubmit(submissionData);
      } else {
        for (const date of formData.dates) {
          const submissionData = {
            date: formatDateForTimezone(date, timezone),
            start_time: formData.start_time,
            end_time: formData.end_time,
            max_orders: parseInt(formData.max_orders),
            slot_type: formData.slot_type,
            is_active: formData.is_active
          };
          await onSubmit(submissionData);
        }
      }
    } catch (error) {
      console.error("Error submitting time slots:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const timeOptions = generateTimeOptions();
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    !timeSlot && /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 p-3 bg-muted/30 rounded-lg", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          id: "bulk_mode",
          checked: bulkMode,
          onCheckedChange: setBulkMode
        }
      ),
      /* @__PURE__ */ jsx(Label, { htmlFor: "bulk_mode", className: "text-sm", children: "Create slots for multiple dates" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs(Label, { children: [
        "Date",
        formData.dates.length > 1 ? "s" : ""
      ] }),
      formData.dates.map((date, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxs(Popover, { children: [
          /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              className: cn(
                "flex-1 justify-start text-left font-normal",
                !date && "text-muted-foreground",
                errors.dates && "border-destructive"
              ),
              disabled: isSubmitting,
              children: [
                /* @__PURE__ */ jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
                date ? formatDateForTimezone(date, timezone) : /* @__PURE__ */ jsx("span", { children: "Pick a date" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", children: /* @__PURE__ */ jsx(
            Calendar,
            {
              mode: "single",
              selected: date,
              onSelect: (selectedDate) => handleDateChange(selectedDate, index),
              disabled: (date2) => {
                const today = getCurrentDateInTimezone(timezone);
                const todayStr = formatDateForTimezone(today, timezone);
                const dateStr = formatDateForTimezone(date2, timezone);
                return dateStr < todayStr;
              },
              initialFocus: true
            }
          ) })
        ] }),
        !timeSlot && formData.dates.length > 1 && /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "icon",
            onClick: () => removeDate(index),
            disabled: isSubmitting,
            children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" })
          }
        )
      ] }, index)),
      !timeSlot && /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: addDate,
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }),
              "Add Date"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: addDateRange,
            disabled: isSubmitting,
            children: "Add Next 7 Days"
          }
        )
      ] }),
      errors.dates && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.dates }),
      formData.dates.length > 1 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 mt-2", children: formData.dates.map((date, index) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: formatDateForTimezone(date, timezone) }, index)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "start_time", children: "Start Time" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.start_time,
            onValueChange: (value) => handleChange("start_time", value),
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: errors.start_time ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select start time" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: timeOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
            ]
          }
        ),
        errors.start_time && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.start_time })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "end_time", children: "End Time" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.end_time,
            onValueChange: (value) => handleChange("end_time", value),
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: errors.end_time ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select end time" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: timeOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
            ]
          }
        ),
        errors.end_time && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.end_time })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "slot_type", children: "Slot Type" }),
        /* @__PURE__ */ jsxs(
          Select,
          {
            value: formData.slot_type,
            onValueChange: (value) => handleChange("slot_type", value),
            disabled: isSubmitting,
            children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: errors.slot_type ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select slot type" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "delivery", children: "Delivery" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "pickup", children: "Pickup" })
              ] })
            ]
          }
        ),
        errors.slot_type && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.slot_type })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "max_orders", children: "Maximum Orders" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "max_orders",
            type: "number",
            min: "1",
            value: formData.max_orders,
            onChange: (e) => handleChange("max_orders", e.target.value),
            className: errors.max_orders ? "border-destructive" : "",
            disabled: isSubmitting
          }
        ),
        errors.max_orders && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: errors.max_orders })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
      /* @__PURE__ */ jsx(
        Checkbox,
        {
          id: "is_active",
          checked: formData.is_active,
          onCheckedChange: (checked) => handleChange("is_active", checked),
          disabled: isSubmitting
        }
      ),
      /* @__PURE__ */ jsx(Label, { htmlFor: "is_active", children: "Active (available for booking)" })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isSubmitting, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Creating..." : timeSlot ? "Update Time Slot" : `Create ${formData.dates.length} Time Slot${formData.dates.length > 1 ? "s" : ""}` })
    ] })
  ] });
};
const AdminTimeSlotsTab = ({ openDeleteDialog }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const fetchTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("time_slots").select("*").order("date", { ascending: true }).order("start_time", { ascending: true });
      if (typeFilter !== "all") {
        query = query.eq("slot_type", typeFilter);
      }
      if (dateFilter === "today") {
        query = query.eq("date", (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
      } else if (dateFilter === "upcoming") {
        query = query.gte("date", (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
      }
      const { data, error } = await query;
      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast$1({ variant: "destructive", title: "Fetch Error", description: "Could not load time slots." });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFilter]);
  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);
  const filteredTimeSlots = timeSlots.filter((slot) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return slot.slot_type.toLowerCase().includes(searchLower) || format(new Date(slot.date), "PPP").toLowerCase().includes(searchLower) || formatTime(slot.start_time).toLowerCase().includes(searchLower) || formatTime(slot.end_time).toLowerCase().includes(searchLower);
  });
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  const handleSlotSubmit = async (slotData) => {
    setLoading(true);
    try {
      let result;
      if (editingSlot) {
        const { data, error } = await supabase.from("time_slots").update({
          ...slotData,
          updated_at: /* @__PURE__ */ new Date()
        }).eq("id", editingSlot.id).select().single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Time Slot Updated", description: "Time slot has been updated successfully." });
      } else {
        const { data, error } = await supabase.from("time_slots").insert(slotData).select().single();
        if (error) throw error;
        result = data;
        toast$1({ title: "Time Slot Created", description: "Time slot has been created successfully." });
      }
      fetchTimeSlots();
      setIsDialogOpen(false);
      setEditingSlot(null);
    } catch (error) {
      console.error("Error saving time slot:", error);
      toast$1({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };
  const triggerDelete = (slotId) => {
    const slotToDelete = timeSlots.find((s) => s.id === slotId);
    if (slotToDelete) {
      openDeleteDialog("time_slot", slotId);
    }
  };
  const getStatusBadge = (slot) => {
    const now = /* @__PURE__ */ new Date();
    const slotDate = new Date(slot.date);
    const isToday = slotDate.toDateString() === now.toDateString();
    const isPast = slotDate < now && !isToday;
    const isFull = slot.current_orders >= slot.max_orders;
    if (isPast) {
      return /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "Past" });
    }
    if (!slot.is_active) {
      return /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: "Inactive" });
    }
    if (isFull) {
      return /* @__PURE__ */ jsx(Badge, { variant: "destructive", children: "Full" });
    }
    if (isToday) {
      return /* @__PURE__ */ jsx(Badge, { variant: "default", children: "Today" });
    }
    return /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "Available" });
  };
  const getAvailabilityColor = (slot) => {
    const percentage = slot.current_orders / slot.max_orders * 100;
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-orange-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-green-600";
  };
  return /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold", children: "Time Slots Management" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(Filter, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "search",
                  placeholder: "Search slots...",
                  className: "pl-8 w-full md:w-[200px]",
                  value: searchTerm,
                  onChange: (e) => setSearchTerm(e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[140px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by type" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Types" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "delivery", children: "Delivery" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "pickup", children: "Pickup" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Select, { value: dateFilter, onValueChange: setDateFilter, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { className: "w-full md:w-[140px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Filter by date" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "all", children: "All Dates" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "today", children: "Today" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "upcoming", children: "Upcoming" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Dialog, { open: isDialogOpen, onOpenChange: (isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) setEditingSlot(null);
            }, children: [
              /* @__PURE__ */ jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { onClick: () => setEditingSlot(null), children: [
                /* @__PURE__ */ jsx(PlusCircle, { className: "w-4 h-4 mr-2" }),
                " Add Time Slot"
              ] }) }),
              /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [
                /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingSlot ? "Edit Time Slot" : "Add New Time Slot" }) }),
                /* @__PURE__ */ jsx(
                  TimeSlotForm,
                  {
                    timeSlot: editingSlot,
                    onSubmit: handleSlotSubmit,
                    onCancel: () => setIsDialogOpen(false)
                  },
                  editingSlot ? editingSlot.id : "new"
                )
              ] })
            ] })
          ] })
        ] }),
        loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) }) : /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxs(Table, { children: [
          /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableHead, { children: "Date" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Time" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Type" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Capacity" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Availability" }),
            /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
            /* @__PURE__ */ jsx(TableHead, { className: "text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx(TableBody, { children: filteredTimeSlots.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: 7, className: "h-24 text-center", children: "No time slots found." }) }) : filteredTimeSlots.map((slot) => /* @__PURE__ */ jsxs(TableRow, { children: [
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Calendar$1, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsx("span", { children: format(new Date(slot.date), "MMM d, yyyy") })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { children: [
                formatTime(slot.start_time),
                " - ",
                formatTime(slot.end_time)
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: slot.slot_type === "delivery" ? "default" : "secondary", children: slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1) }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-muted-foreground" }),
              /* @__PURE__ */ jsxs("span", { children: [
                slot.max_orders,
                " orders"
              ] })
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("span", { className: getAvailabilityColor(slot), children: [
              slot.current_orders,
              " / ",
              slot.max_orders
            ] }) }),
            /* @__PURE__ */ jsx(TableCell, { children: getStatusBadge(slot) }),
            /* @__PURE__ */ jsxs(TableCell, { className: "text-right", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  onClick: () => {
                    setEditingSlot(slot);
                    setIsDialogOpen(true);
                  },
                  children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "text-destructive hover:text-destructive",
                  onClick: () => triggerDelete(slot.id),
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              )
            ] })
          ] }, slot.id)) })
        ] }) })
      ]
    }
  );
};
const DeleteConfirmationDialog = ({ isOpen, onOpenChange, itemType, onConfirm, isDeleting }) => {
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { children: "Confirm Deletion" }),
      /* @__PURE__ */ jsxs(DialogDescription, { children: [
        "Are you sure you want to delete this ",
        itemType,
        "? This action cannot be undone. Associated images will also be removed."
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onOpenChange(false), disabled: isDeleting, children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: onConfirm, disabled: isDeleting, children: isDeleting ? "Deleting..." : "Delete" })
    ] })
  ] }) });
};
const useAdminRedirect = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast$1({ variant: "destructive", title: "Authentication Required", description: "Please log in to access this page." });
        navigate("/admin-login");
      } else if (!isAdmin) {
        toast$1({ variant: "destructive", title: "Access Denied", description: "You must be an admin to view this page." });
        navigate("/admin-login");
      }
    }
  }, [isAdmin, authLoading, user, navigate]);
  return { authLoading, isAdmin };
};
const useAdminDataDeletion = (activeTabSetter) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteFile } = useSupabaseStorage();
  const openDeleteDialog = useCallback((type, id, imageUrl = null) => {
    setItemToDelete({ type, id, imageUrl });
    setIsDeleteDialogOpen(true);
  }, []);
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      let tableName = "";
      let itemName = itemToDelete.type;
      if (itemToDelete.type === "product") tableName = "products";
      else if (itemToDelete.type === "category") {
        tableName = "categories";
        const { data: productsInCategory, error: checkError } = await supabase.from("products").select("id").eq("category_id", itemToDelete.id).limit(1);
        if (checkError) throw checkError;
        if (productsInCategory && productsInCategory.length > 0) {
          throw new Error("Cannot delete category as it is assigned to products.");
        }
      } else if (itemToDelete.type === "time_slot") {
        tableName = "time_slots";
        const { data: ordersWithSlot, error: checkError } = await supabase.from("orders").select("id").eq("timeslot_id", itemToDelete.id).limit(1);
        if (checkError) throw checkError;
        if (ordersWithSlot && ordersWithSlot.length > 0) {
          throw new Error("Cannot delete time slot as it has associated orders.");
        }
        const { data: pickupOrdersWithSlot, error: checkError2 } = await supabase.from("pickup_orders").select("id").eq("timeslot_id", itemToDelete.id).limit(1);
        if (checkError2) throw checkError2;
        if (pickupOrdersWithSlot && pickupOrdersWithSlot.length > 0) {
          throw new Error("Cannot delete time slot as it has associated pickup orders.");
        }
      } else throw new Error("Invalid item type for deletion");
      const { error: dbError } = await supabase.from(tableName).delete().eq("id", itemToDelete.id);
      if (dbError) throw dbError;
      if (itemToDelete.imageUrl) {
        const { error: storageError } = await deleteFile(itemToDelete.imageUrl);
        if (storageError) console.warn("Failed to delete associated image:", storageError);
      }
      toast$1({ title: `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} Deleted` });
      const currentTab = activeTabSetter((prev) => prev);
      activeTabSetter("");
      setTimeout(() => activeTabSetter(currentTab), 0);
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast$1({ variant: "destructive", title: "Deletion Failed", description: error.message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  return { isDeleteDialogOpen, itemToDelete, isDeleting, openDeleteDialog, confirmDelete, setIsDeleteDialogOpen };
};
const AdminPageHeader = () => /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "mb-8", children: [
  /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Admin Dashboard" }),
  /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground", children: "Manage orders, products, categories, and settings for Groceroo." })
] });
const AdminPage = () => {
  const { authLoading, isAdmin } = useAdminRedirect();
  const { getOrdersByStatus } = useOrders();
  const [activeTab, setActiveTab] = useState("orders");
  const { isDeleteDialogOpen, itemToDelete, isDeleting, openDeleteDialog, confirmDelete, setIsDeleteDialogOpen } = useAdminDataDeletion(setActiveTab);
  const pendingOrdersCount = getOrdersByStatus("pending").length;
  const processingOrdersCount = getOrdersByStatus("processing").length;
  const deliveredOrdersCount = getOrdersByStatus("delivered").length;
  if (authLoading) {
    return /* @__PURE__ */ jsx("div", { className: "container flex items-center justify-center h-screen", children: /* @__PURE__ */ jsx("div", { className: "w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  if (!isAdmin) return null;
  const tabItems = [
    { value: "orders", label: "Orders", icon: Package, component: /* @__PURE__ */ jsx(AdminOrdersTab, {}) },
    { value: "pickup-orders", label: "Store Pickups", icon: ShoppingBag, component: /* @__PURE__ */ jsx(AdminPickupOrdersTab, {}) },
    { value: "products", label: "Products", icon: List, component: /* @__PURE__ */ jsx(AdminProductsTab, { openDeleteDialog }, "products") },
    { value: "categories", label: "Categories", icon: Tag, component: /* @__PURE__ */ jsx(AdminCategoriesTab, { openDeleteDialog }, "categories") },
    { value: "stores", label: "Stores", icon: Store, component: /* @__PURE__ */ jsx(AdminStoresTab, {}) },
    { value: "time-slots", label: "Time Slots", icon: Clock, component: /* @__PURE__ */ jsx(AdminTimeSlotsTab, { openDeleteDialog }, "time-slots") },
    { value: "settings", label: "Settings", icon: Settings, component: /* @__PURE__ */ jsx(AdminSettingsTab, {}) }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "container px-4 py-8 mx-auto md:px-6", children: [
    /* @__PURE__ */ jsx(AdminPageHeader, {}),
    /* @__PURE__ */ jsx(
      AdminSummaryCards,
      {
        pendingCount: pendingOrdersCount,
        processingCount: processingOrdersCount,
        deliveredCount: deliveredOrdersCount
      }
    ),
    /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "mt-8 space-y-6", children: [
      /* @__PURE__ */ jsx(TabsList, { className: "grid w-full grid-cols-7 md:w-auto md:inline-flex", children: tabItems.map((tab) => /* @__PURE__ */ jsxs(TabsTrigger, { value: tab.value, className: "flex items-center", children: [
        /* @__PURE__ */ jsx(tab.icon, { className: "w-4 h-4 mr-2" }),
        tab.label
      ] }, tab.value)) }),
      tabItems.map((tab) => /* @__PURE__ */ jsx(TabsContent, { value: tab.value, children: tab.component }, tab.value))
    ] }),
    /* @__PURE__ */ jsx(
      DeleteConfirmationDialog,
      {
        isOpen: isDeleteDialogOpen,
        onOpenChange: setIsDeleteDialogOpen,
        itemType: itemToDelete == null ? void 0 : itemToDelete.type,
        onConfirm: confirmDelete,
        isDeleting
      }
    )
  ] });
};
const StoreSelector = ({ stores, selectedStores, onStoreToggle, onNotesChange, onEstimatedTotalChange }) => {
  const getMinimumOrder = (storeCount) => {
    const baseAmount = 30;
    return baseAmount;
  };
  const handleStoreSelect = (store) => {
    const isSelected = selectedStores.some((s) => s.id === store.id);
    if (isSelected) {
      onStoreToggle(selectedStores.filter((s) => s.id !== store.id));
    } else {
      const newSelectedStores = [...selectedStores, {
        id: store.id,
        name: store.name,
        estimatedTotal: getMinimumOrder(selectedStores.length + 1),
        notes: ""
      }];
      onStoreToggle(newSelectedStores);
    }
  };
  const handleNotesChange = (storeId, notes) => {
    const updatedStores = selectedStores.map(
      (store) => store.id === storeId ? { ...store, notes } : store
    );
    onStoreToggle(updatedStores);
    onNotesChange(storeId, notes);
  };
  const handleEstimatedTotalChange = (storeId, total) => {
    const updatedStores = selectedStores.map(
      (store) => store.id === storeId ? { ...store, estimatedTotal: parseFloat(total) || 0 } : store
    );
    onStoreToggle(updatedStores);
    onEstimatedTotalChange(storeId, total);
  };
  return /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2", children: stores.map((store) => {
    var _a, _b;
    const isSelected = selectedStores.some((s) => s.id === store.id);
    const selectedStore = selectedStores.find((s) => s.id === store.id);
    const minimumOrder = store.minimum_order_amount || getMinimumOrder(selectedStores.length + (isSelected ? 0 : 1));
    return /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        children: /* @__PURE__ */ jsxs(Card, { className: `cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`, children: [
          /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden", children: store.image ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: store.image,
                  alt: store.name,
                  className: "w-full h-full object-cover"
                }
              ) : /* @__PURE__ */ jsx(Store, { className: "w-6 h-6 text-muted-foreground" }) }),
              /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: store.name })
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "button",
                variant: isSelected ? "default" : "outline",
                size: "sm",
                onClick: () => handleStoreSelect(store),
                children: isSelected ? /* @__PURE__ */ jsx(Minus, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" })
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-1" }),
              store.address
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mr-1" }),
              (_a = store.opening_time) == null ? void 0 : _a.slice(0, 5),
              " - ",
              (_b = store.closing_time) == null ? void 0 : _b.slice(0, 5)
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center", children: /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
              "Min: ",
              formatCurrency(minimumOrder)
            ] }) }),
            isSelected && /* @__PURE__ */ jsxs(
              motion.div,
              {
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: "auto" },
                exit: { opacity: 0, height: 0 },
                className: "space-y-3 pt-3 border-t",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: `estimated-${store.id}`, children: "Estimated Total ($)" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: `estimated-${store.id}`,
                        type: "text",
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        min: minimumOrder,
                        step: "5",
                        value: selectedStore == null ? void 0 : selectedStore.estimatedTotal,
                        onChange: (e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          handleEstimatedTotalChange(store.id, val);
                        },
                        onBlur: (e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val) || val < minimumOrder) {
                            val = minimumOrder;
                          }
                          handleEstimatedTotalChange(store.id, val);
                        },
                        placeholder: `Minimum ${formatCurrency(minimumOrder)}`
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: `notes-${store.id}`, children: "Shopping List / Notes (or do it later) " }),
                    /* @__PURE__ */ jsx(
                      Textarea,
                      {
                        id: `notes-${store.id}`,
                        value: (selectedStore == null ? void 0 : selectedStore.notes) || "",
                        onChange: (e) => handleNotesChange(store.id, e.target.value),
                        placeholder: "Enter your shopping list or special instructions...",
                        rows: 3
                      }
                    )
                  ] })
                ]
              }
            )
          ] })
        ] })
      },
      store.id
    );
  }) }) }) });
};
const PhotoUpload = ({ photos, onPhotosChange, maxPhotos = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, "image/jpeg", quality);
      };
      img.src = URL.createObjectURL(file);
    });
  };
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > maxPhotos) {
      toast$1({
        variant: "destructive",
        title: "Too many photos",
        description: `You can only upload up to ${maxPhotos} photos.`
      });
      return;
    }
    setUploading(true);
    try {
      const compressedPhotos = await Promise.all(
        files.map(async (file) => {
          const compressedFile = await compressImage(file);
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = () => {
              resolve({
                id: Date.now() + Math.random(),
                name: file.name,
                data: reader.result,
                size: compressedFile.size
              });
            };
            reader.readAsDataURL(compressedFile);
          });
        })
      );
      onPhotosChange([...photos, ...compressedPhotos]);
      toast$1({
        title: "Photos uploaded",
        description: `${compressedPhotos.length} photo(s) added successfully.`
      });
    } catch (error) {
      console.error("Error compressing photos:", error);
      toast$1({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to process photos. Please try again."
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  const removePhoto = (photoId) => {
    onPhotosChange(photos.filter((photo) => photo.id !== photoId));
  };
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Label, { children: "Photos (Optional)" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Upload photos of your shopping list or special items. Max ",
        maxPhotos,
        " photos."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => {
            var _a;
            return (_a = fileInputRef.current) == null ? void 0 : _a.click();
          },
          disabled: uploading || photos.length >= maxPhotos,
          className: "flex items-center",
          children: [
            uploading ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" }) : /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4 mr-2" }),
            uploading ? "Processing..." : "Upload Photos"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          multiple: true,
          onChange: handleFileSelect,
          className: "hidden"
        }
      )
    ] }),
    photos.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: photos.map((photo) => /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx("div", { className: "aspect-square rounded-lg overflow-hidden bg-muted border", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: photo.data,
          alt: photo.name,
          className: "w-full h-full object-cover"
        }
      ) }),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "destructive",
          size: "icon",
          className: "absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
          onClick: () => removePhoto(photo.id),
          children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: [
        photo.name,
        " (",
        formatFileSize(photo.size),
        ")"
      ] })
    ] }, photo.id)) })
  ] });
};
const StorePickupPage = () => {
  var _a;
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateInTimezone());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [photos, setPhotos] = useState([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [contactPreference, setContactPreference] = useState("whatsapp");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState("");
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("new-order");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [reorderPreviousItems, setReorderPreviousItems] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({ convenience_fee_percent: 7, service_fee_percent: 3 });
  const navigate = useNavigate();
  useEffect(() => {
    Promise.all([fetchStores(), fetchPostcodes(), fetchTimezone()]);
    if (user) {
      fetchUpcomingOrders();
      if (user.phone) {
        setPhoneNumber(user.phone);
        setWhatsappNumber(user.phone);
      }
    }
  }, [user]);
  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(
        (pc) => pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) || pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);
  useEffect(() => {
    if (storeSearchQuery.length === 0) {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(
        (store) => store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) || store.address.toLowerCase().includes(storeSearchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [storeSearchQuery, stores]);
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate, timezone]);
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      const { data, error } = await supabase.from("delivery_settings").select("convenience_fee_percent, service_fee_percent").eq("id", 1).single();
      if (!error && data) {
        setDeliverySettings({
          convenience_fee_percent: data.convenience_fee_percent || 7,
          service_fee_percent: data.service_fee_percent || 3
        });
      }
    };
    fetchDeliverySettings();
  }, []);
  const shouldShowLogin = !user && selectedStores.length > 0 && selectedDate && selectedTimeSlot;
  const fetchTimezone = async () => {
    try {
      const { data, error } = await supabase.from("delivery_settings").select("timezone").eq("id", 1).single();
      if (!error && (data == null ? void 0 : data.timezone)) {
        setTimezone(data.timezone);
      }
    } catch (error) {
      console.error("Error fetching timezone:", error);
    }
  };
  const fetchStores = async () => {
    try {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      setStores(data || []);
      setFilteredStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load stores." });
    } finally {
      setLoading(false);
    }
  };
  const fetchPostcodes = async () => {
    try {
      const { data, error } = await supabase.from("postcodes").select("*").order("suburb");
      if (error) throw error;
      setPostcodes(data || []);
      setFilteredPostcodes(data || []);
    } catch (error) {
      console.error("Error fetching postcodes:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load postcodes." });
    }
  };
  const fetchAvailableTimeSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const dateString = formatDateForTimezone(date, timezone);
      const { data, error } = await supabase.from("time_slots").select("*").eq("date", dateString).eq("is_active", true).order("start_time");
      if (error) throw error;
      setAvailableTimeSlots(data || []);
      setSelectedTimeSlot("");
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };
  const fetchUpcomingOrders = async () => {
    try {
      const { data, error } = await supabase.from("pickup_orders").select(`
          *,
          pickup_order_stores (
            store_id,
            estimated_total,
            actual_total,
            notes,
            status,
            stores (name)
          )
        `).eq("user_id", user.id).in("status", ["pending", "processing", "ready"]).gte("pickup_date", formatDateForTimezone(getCurrentDateInTimezone(timezone), timezone)).order("pickup_date", { ascending: true });
      if (error) throw error;
      setUpcomingOrders(data || []);
    } catch (error) {
      console.error("Error fetching upcoming orders:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load upcoming orders." });
    }
  };
  const handleAddressSelect = (selectedAddress) => {
    const savedAddress = user.addresses.find((addr) => addr.address === selectedAddress);
    if (savedAddress) {
      setAddress(savedAddress.address);
      setPostcode(savedAddress.postcode);
      const postcodeData = postcodes.find((pc) => pc.postcode === savedAddress.postcode);
      if (postcodeData) {
        setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
      }
    }
    setShowAddressSelector(false);
  };
  const handleAddressAutocomplete = (addressDetails) => {
    setAddress(addressDetails.address);
    setPostcode(addressDetails.postcode);
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };
  const handlePostcodeSelect = (postcodeData) => {
    setPostcode(postcodeData.postcode);
    setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
    setShowPostcodeDropdown(false);
  };
  const handlePromoApplied = (promo) => {
    setAppliedPromo(promo);
  };
  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };
  const handleLoginSuccess = () => {
    setShowLoginForm(false);
  };
  const validateForm = () => {
    const errors = {};
    if (selectedStores.length === 0) errors.stores = "Please select at least one store";
    if (!selectedTimeSlot) errors.timeSlot = "Please select a time slot";
    if (contactPreference === "whatsapp" && !whatsappNumber) {
      errors.whatsapp = "WhatsApp number is required for WhatsApp communication";
    }
    if (contactPreference === "phone" && !phoneNumber) {
      errors.phone = "Phone number is required for SMS/Call communication";
    }
    if (!address) errors.address = "Delivery address is required";
    if (!postcode) errors.postcode = "Please select a postcode";
    selectedStores.forEach((store, index) => {
      const minimumOrder = 30;
      if (!store.estimatedTotal || store.estimatedTotal < minimumOrder) {
        errors[`store_${store.id}`] = `Minimum order for this store is ${formatCurrency(minimumOrder)}`;
      }
    });
    if (!termsAccepted) {
      errors.terms = "You must accept the terms and conditions";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast$1({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields and accept the terms." });
      return;
    }
    try {
      const subtotal = selectedStores.reduce((total, store) => total + (store.estimatedTotal || 0), 0);
      const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
      const finalTotal = getFinalTotal();
      const timeSlot = availableTimeSlots.find((slot) => slot.id === selectedTimeSlot);
      const timeSlotDisplay = timeSlot ? `${formatTimeToAMPM(timeSlot.start_time)} - ${formatTimeToAMPM(timeSlot.end_time)}` : "";
      const { data: pickupOrder, error: orderError } = await supabase.from("pickup_orders").insert({
        user_id: user.id,
        pickup_date: formatDateForTimezone(selectedDate, timezone),
        time_slot: timeSlotDisplay,
        timeslot_id: selectedTimeSlot,
        whatsapp_number: contactPreference === "whatsapp" ? whatsappNumber : null,
        phone_number: contactPreference === "phone" ? phoneNumber : null,
        delivery_address: address,
        postcode,
        photos,
        status: "pending",
        payment_status: "pending",
        estimated_total: subtotal,
        // Use subtotal, not finalTotal
        promo_code: (appliedPromo == null ? void 0 : appliedPromo.code) || null,
        discount_amount: discountAmount,
        admin_messages: reorderPreviousItems ? [{
          from: "customer",
          message: "Please reorder my previous items along with this order.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }] : []
      }).select().single();
      if (orderError) throw orderError;
      const storeOrders = selectedStores.map((store) => ({
        pickup_order_id: pickupOrder.id,
        store_id: store.id,
        estimated_total: store.estimatedTotal,
        notes: store.notes,
        status: "pending"
      }));
      const { error: storeOrdersError } = await supabase.from("pickup_order_stores").insert(storeOrders);
      if (storeOrdersError) throw storeOrdersError;
      if (appliedPromo) {
        await supabase.rpc("increment_promo_usage", { promo_code: appliedPromo.code });
      }
      navigate("/pickup-payment", {
        state: {
          orderId: pickupOrder.id,
          orderData: {
            pickup_date: formatDateForTimezone(selectedDate, timezone),
            time_slot: timeSlotDisplay,
            contact_preference: contactPreference,
            whatsapp_number: contactPreference === "whatsapp" ? whatsappNumber : null,
            phone_number: contactPreference === "phone" ? phoneNumber : null,
            delivery_address: address,
            postcode,
            estimated_total: finalTotal,
            promo_code: (appliedPromo == null ? void 0 : appliedPromo.code) || null,
            discount_amount: discountAmount,
            stores: selectedStores
          },
          finalTotal
        }
      });
    } catch (error) {
      console.error("Error creating pickup order:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not create pickup order." });
    }
  };
  const handleSendMessage = async (orderId, message) => {
    try {
      const { data: currentOrder, error: fetchError } = await supabase.from("pickup_orders").select("admin_messages").eq("id", orderId).single();
      if (fetchError) throw fetchError;
      const currentMessages = currentOrder.admin_messages || [];
      const newMessage = {
        from: "customer",
        message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error: updateError } = await supabase.from("pickup_orders").update({
        admin_messages: [...currentMessages, newMessage]
      }).eq("id", orderId);
      if (updateError) throw updateError;
      toast$1({ title: "Message sent", description: "Your message has been sent to the admin." });
      fetchUpcomingOrders();
    } catch (error) {
      console.error("Error sending message:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };
  const getSubtotal = () => {
    return Number(orderSummary.subtotal || 0);
  };
  const getDeliveryFee = () => {
    return Number(orderSummary.deliveryFee || 0);
  };
  const getDiscount = () => {
    return Number(orderSummary.discountAmount || 0);
  };
  const getConvenienceFee = () => {
    return parseFloat((getSubtotal() * (deliverySettings.convenience_fee_percent / 100)).toFixed(2));
  };
  const getServiceFee = () => {
    const base = getSubtotal() + getDeliveryFee() + getConvenienceFee();
    return parseFloat((base * (deliverySettings.service_fee_percent / 100)).toFixed(2));
  };
  const getFinalTotal = () => {
    const total = getSubtotal() + getDeliveryFee() + getConvenienceFee() + getServiceFee() - getDiscount();
    return parseFloat(total.toFixed(2));
  };
  const getOrderSummary = () => {
    const subtotal = selectedStores.reduce((total2, store) => total2 + (store.estimatedTotal || 0), 0);
    const serviceCharge = subtotal * 0.1;
    const highestDeliveryFee = selectedStores.reduce((highest, selectedStore) => {
      const store = stores.find((s) => s.id === selectedStore.id);
      const deliveryFee = (store == null ? void 0 : store.store_delivery_fee) || 0;
      return Math.max(highest, deliveryFee);
    }, 0);
    const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
    const total = subtotal + serviceCharge + highestDeliveryFee - discountAmount;
    return {
      subtotal,
      serviceCharge,
      deliveryFee: highestDeliveryFee,
      discountAmount,
      total
    };
  };
  const orderSummary = getOrderSummary();
  const isDateDisabled = (date) => {
    const today = getCurrentDateInTimezone(timezone);
    const todayStr = formatDateForTimezone(today, timezone);
    const dateStr = formatDateForTimezone(date, timezone);
    return dateStr < todayStr;
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative h-[30vh] min-h-[240px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/banner_bg.jpeg",
            alt: "Grocery Delivery",
            className: "w-full h-full object-cover opacity-20"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "container relative h-full px-4 md:px-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col justify-center h-full py-2", children: /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "space-y-2",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5 },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center mb-2", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-lg md:text-xl font-bold text-white mb-1", children: "Grocery Run" }),
              /* @__PURE__ */ jsx("p", { className: "text-white/90 text-xs", children: "Let us do the shopping for you at multiple stores!" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-1 grid-cols-2 md:grid-cols-4 max-w-2xl mx-auto", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Store, { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white" }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-medium text-white text-xs", children: "1. Add Stores" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-white/80 hidden md:block", children: "Select stores and set budget" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white" }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-medium text-white text-xs", children: "2. Share Lists" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-white/80 hidden md:block", children: "Add shopping lists" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Clock, { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white" }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-medium text-white text-xs", children: "3. We Shop" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-white/80 hidden md:block", children: "We shop at all stores" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(MapPin, { className: "w-2.5 h-2.5 md:w-3 md:h-3 text-white" }) }),
                /* @__PURE__ */ jsx("h3", { className: "font-medium text-white text-xs", children: "4. Delivery" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-white/80 hidden md:block", children: "All items in one trip" })
              ] })
            ] })
          ]
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container px-4 py-6 mx-auto md:px-6", children: /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
        className: "max-w-6xl mx-auto",
        children: /* @__PURE__ */ jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [
            /* @__PURE__ */ jsx(TabsTrigger, { value: "new-order", children: "New Order" }),
            /* @__PURE__ */ jsxs(TabsTrigger, { value: "upcoming-orders", children: [
              "Upcoming Orders (",
              upcomingOrders.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsx(TabsContent, { value: "new-order", className: "space-y-6", children: /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsx(CardTitle, { children: "Schedule a Multi-Store Run" }),
              /* @__PURE__ */ jsx(CardDescription, { children: "Add one or more stores and we'll shop at all of them for you" })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Select Stores" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative w-64", children: [
                    /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        type: "search",
                        placeholder: "Search stores...",
                        className: "pl-8",
                        value: storeSearchQuery,
                        onChange: (e) => setStoreSearchQuery(e.target.value)
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  StoreSelector,
                  {
                    stores: filteredStores,
                    selectedStores,
                    onStoreToggle: setSelectedStores,
                    onNotesChange: () => {
                    },
                    onEstimatedTotalChange: () => {
                    }
                  }
                )
              ] }),
              formErrors.stores && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.stores }),
              /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Select Date" }),
                  /* @__PURE__ */ jsxs(Popover, { children: [
                    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "outline",
                        className: cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        ),
                        children: [
                          /* @__PURE__ */ jsx(Calendar$1, { className: "mr-2 h-4 w-4" }),
                          selectedDate ? formatDateForTimezone(selectedDate, timezone) : /* @__PURE__ */ jsx("span", { children: "Pick a date" })
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: /* @__PURE__ */ jsx(
                      Calendar,
                      {
                        mode: "single",
                        selected: selectedDate,
                        onSelect: setSelectedDate,
                        disabled: isDateDisabled,
                        initialFocus: true
                      }
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { children: "Time Slot" }),
                  loadingSlots ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-4", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" }) }) : availableTimeSlots.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground py-2", children: "No available time slots for this date." }) : /* @__PURE__ */ jsxs(Select, { value: selectedTimeSlot, onValueChange: setSelectedTimeSlot, children: [
                    /* @__PURE__ */ jsx(SelectTrigger, { className: formErrors.timeSlot ? "border-destructive" : "", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose a time slot" }) }),
                    /* @__PURE__ */ jsx(SelectContent, { children: availableTimeSlots.map((slot) => /* @__PURE__ */ jsxs(SelectItem, { value: slot.id, children: [
                      formatTimeToAMPM(slot.start_time),
                      " - ",
                      formatTimeToAMPM(slot.end_time)
                    ] }, slot.id)) })
                  ] }),
                  formErrors.timeSlot && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.timeSlot })
                ] })
              ] }),
              shouldShowLogin && /* @__PURE__ */ jsxs(Card, { className: "border-primary/20 bg-primary/5", children: [
                /* @__PURE__ */ jsxs(CardHeader, { children: [
                  /* @__PURE__ */ jsx(CardTitle, { children: "Sign in to Continue" }),
                  /* @__PURE__ */ jsx(CardDescription, { children: "Please sign in to complete your grocery run order" })
                ] }),
                /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "max-w-lg mx-auto", children: /* @__PURE__ */ jsx(PhoneLoginForm, { onSuccess: handleLoginSuccess }) }) })
              ] }),
              user && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { children: "Contact Preference" }),
                    /* @__PURE__ */ jsxs(RadioGroup, { value: contactPreference, onValueChange: setContactPreference, className: "grid gap-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                        /* @__PURE__ */ jsx(RadioGroupItem, { value: "whatsapp", id: "whatsapp" }),
                        /* @__PURE__ */ jsx(Label, { htmlFor: "whatsapp", children: "WhatsApp" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                        /* @__PURE__ */ jsx(RadioGroupItem, { value: "phone", id: "phone" }),
                        /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "SMS/Call" })
                      ] })
                    ] })
                  ] }),
                  contactPreference === "whatsapp" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "whatsapp", children: "WhatsApp Number" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "whatsapp",
                        value: whatsappNumber,
                        onChange: (e) => setWhatsappNumber(e.target.value),
                        placeholder: "Enter your WhatsApp number",
                        className: formErrors.whatsapp ? "border-destructive" : ""
                      }
                    ),
                    formErrors.whatsapp && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.whatsapp })
                  ] }),
                  contactPreference === "phone" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "phone",
                        value: phoneNumber,
                        onChange: (e) => setPhoneNumber(e.target.value),
                        placeholder: "Enter your phone number",
                        className: formErrors.phone ? "border-destructive" : ""
                      }
                    ),
                    formErrors.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.phone })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      id: "reorder",
                      checked: reorderPreviousItems,
                      onCheckedChange: setReorderPreviousItems
                    }
                  ),
                  /* @__PURE__ */ jsx(Label, { htmlFor: "reorder", className: "text-sm", children: "Reorder my previous items (we'll add them to this order)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: "address", children: "Delivery Address" }),
                    user && ((_a = user.addresses) == null ? void 0 : _a.length) > 0 && /* @__PURE__ */ jsxs(
                      Button,
                      {
                        type: "button",
                        variant: "ghost",
                        size: "sm",
                        onClick: () => setShowAddressSelector(!showAddressSelector),
                        className: "flex items-center text-primary",
                        children: [
                          /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-1" }),
                          showAddressSelector ? "Hide saved addresses" : "Use saved address"
                        ]
                      }
                    )
                  ] }),
                  showAddressSelector && /* @__PURE__ */ jsx(AddressSelector, { onSelect: handleAddressSelect }),
                  /* @__PURE__ */ jsx(
                    AddressAutocomplete,
                    {
                      value: address,
                      onChange: setAddress,
                      onAddressSelect: handleAddressAutocomplete,
                      placeholder: "Start typing your address...",
                      className: formErrors.address ? "border-destructive" : ""
                    }
                  ),
                  formErrors.address && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.address })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsx(Label, { htmlFor: "postcode", children: "Suburb & Postcode" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      Input,
                      {
                        id: "postcode",
                        placeholder: "Search suburb or postcode...",
                        value: postcodeSearch,
                        onChange: (e) => {
                          setPostcodeSearch(e.target.value);
                          setShowPostcodeDropdown(true);
                        },
                        onFocus: () => setShowPostcodeDropdown(true),
                        className: formErrors.postcode ? "border-destructive" : ""
                      }
                    ),
                    showPostcodeDropdown && filteredPostcodes.length > 0 && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto", children: filteredPostcodes.slice(0, 10).map((pc) => /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className: "px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0",
                        onClick: () => handlePostcodeSelect(pc),
                        children: [
                          /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: pc.suburb }),
                          /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: pc.postcode })
                        ]
                      },
                      `${pc.suburb}-${pc.postcode}`
                    )) })
                  ] }),
                  formErrors.postcode && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.postcode })
                ] }),
                selectedStores.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 border rounded-lg", children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-4", children: "Promo Code" }),
                  /* @__PURE__ */ jsx(
                    PromoCodeInput,
                    {
                      subtotal: orderSummary.subtotal,
                      onPromoApplied: handlePromoApplied,
                      appliedPromo,
                      onPromoRemoved: handlePromoRemoved
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("hr", {}),
                selectedStores.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-2", children: selectedStores.map((store) => /* @__PURE__ */ jsx("span", { className: "bg-seagreen text-white-800 border border-gray-200 rounded-full px-6 py-1 text-xs font-medium shadow-sm", children: store.name }, store.id)) }),
                selectedStores.length > 0 && /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    className: "p-4 border rounded-lg bg-muted/30",
                    children: [
                      /* @__PURE__ */ jsx("h4", { className: "font-semibold mb-2", children: "Order Summary" }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                          /* @__PURE__ */ jsx("span", { children: "Estimated Subtotal:" }),
                          /* @__PURE__ */ jsx("span", { children: formatCurrency(getSubtotal()) })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                          /* @__PURE__ */ jsxs("span", { children: [
                            "Convenience Fee (",
                            deliverySettings.convenience_fee_percent,
                            "%):"
                          ] }),
                          /* @__PURE__ */ jsx("span", { children: formatCurrency(getConvenienceFee()) })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                          /* @__PURE__ */ jsx("span", { children: "Delivery Fee :" }),
                          /* @__PURE__ */ jsx("span", { children: formatCurrency(getDeliveryFee()) })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                          /* @__PURE__ */ jsxs("span", { children: [
                            "Service Fee (",
                            deliverySettings.service_fee_percent,
                            "%):"
                          ] }),
                          /* @__PURE__ */ jsx("span", { children: formatCurrency(getServiceFee()) })
                        ] }),
                        appliedPromo && getDiscount() > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-green-600", children: [
                          /* @__PURE__ */ jsxs("span", { children: [
                            "Discount (",
                            appliedPromo.code,
                            "):"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { children: [
                            "-",
                            formatCurrency(getDiscount())
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-semibold pt-2 border-t", children: [
                          /* @__PURE__ */ jsx("span", { children: "Estimated Total:" }),
                          /* @__PURE__ */ jsx("span", { children: formatCurrency(getFinalTotal()) })
                        ] })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                  /* @__PURE__ */ jsx(
                    Checkbox,
                    {
                      id: "terms",
                      checked: termsAccepted,
                      onCheckedChange: setTermsAccepted
                    }
                  ),
                  /* @__PURE__ */ jsxs(Label, { htmlFor: "terms", className: "text-sm", children: [
                    "I agree to the ",
                    /* @__PURE__ */ jsx(Link, { to: "/terms", className: "text-primary hover:underline", target: "_blank", children: "Terms and Conditions" }),
                    " and",
                    " ",
                    /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "text-primary hover:underline", target: "_blank", children: "Privacy Policy" })
                  ] })
                ] }),
                formErrors.terms && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: formErrors.terms }),
                /* @__PURE__ */ jsxs(Button, { type: "submit", className: "w-full", disabled: selectedStores.length === 0, children: [
                  "Proceed to Payment  ",
                  /* @__PURE__ */ jsx(CreditCard, {})
                ] })
              ] })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsx(TabsContent, { value: "upcoming-orders", children: /* @__PURE__ */ jsx(
            UpcomingOrders,
            {
              orders: upcomingOrders,
              onSendMessage: handleSendMessage
            }
          ) })
        ] })
      }
    ) })
  ] });
};
const PickupPaymentPage = () => {
  var _a;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId, orderData, finalTotal } = location.state || {};
  useEffect(() => {
    if (!orderId || !orderData || !finalTotal) {
      navigate("/store-pickup");
      return;
    }
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-stripe-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY"
          },
          body: JSON.stringify({
            order_type: "pickup",
            orderId,
            orderData,
            amount: Math.round(finalTotal * 100),
            // Convert to cents
            user_id: user.id,
            productList: null
          })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    createPaymentIntent();
  }, [orderId, orderData, finalTotal, navigate, user.id]);
  const handlePaymentSuccess = async (data) => {
    try {
      const { error: updateError } = await supabase.from("pickup_orders").update({
        payment_status: "paid",
        payment_data: data.payment_data,
        status: "processing"
      }).eq("id", orderId);
      if (updateError) throw updateError;
      toast$1({
        title: "Payment Successful",
        description: "Your grocery run has been scheduled and payment confirmed."
      });
      navigate("/store-pickup", {
        state: {
          tab: "upcoming-orders",
          message: "Your grocery run has been scheduled successfully!"
        }
      });
    } catch (error2) {
      console.error("Error updating order:", error2);
      setError("Payment successful but failed to update order. Please contact support.");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "container py-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-destructive mb-4", children: "Payment Error" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: error }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => navigate("/store-pickup"), variant: "outline", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Return to Grocery Run"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "container py-8", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-3xl md:max-w-4xl mx-auto",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              onClick: () => navigate("/store-pickup"),
              className: "mb-4",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                "Back to Grocery Run"
              ]
            }
          ),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Complete Payment" }),
          /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Secure payment for your grocery run" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-8 md:grid-cols-2", children: [
          /* @__PURE__ */ jsxs(Card, { className: "bg-muted/30 border", children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center", children: [
              /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 mr-2" }),
              "Order Summary"
            ] }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { children: "Pickup Date:" }),
                  /* @__PURE__ */ jsx("span", { children: new Date(orderData.pickup_date).toLocaleDateString() })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { children: "Time Slot:" }),
                  /* @__PURE__ */ jsx("span", { children: orderData.time_slot })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { children: "Stores:" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    ((_a = orderData.stores) == null ? void 0 : _a.length) || 0,
                    " stores"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
                  /* @__PURE__ */ jsx("span", { children: "Contact:" }),
                  /* @__PURE__ */ jsx("span", { children: orderData.contact_preference === "whatsapp" ? `WhatsApp: ${orderData.whatsapp_number}` : `Phone: ${orderData.phone_number}` })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-4 border-t", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-semibold", children: [
                /* @__PURE__ */ jsx("span", { children: "Total Amount:" }),
                /* @__PURE__ */ jsx("span", { className: "text-lg", children: formatCurrency(finalTotal) })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Payment Details" }) }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
              StripeCheckoutForm,
              {
                clientSecret,
                onPaymentSuccess: handlePaymentSuccess
              }
            ) })
          ] })
        ] })
      ]
    }
  ) });
};
const PickupOrderDetailsPage = () => {
  var _a;
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [storeNotes, setStoreNotes] = useState({});
  const [storePhotos, setStorePhotos] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  useEffect(() => {
    if (!user) {
      navigate("/store-pickup");
      return;
    }
    fetchOrderDetails();
  }, [id, user, navigate]);
  const fetchOrderDetails = async () => {
    var _a2;
    try {
      const { data, error } = await supabase.from("pickup_orders").select(`
          *,
          pickup_order_stores (
            id,
            store_id,
            estimated_total,
            actual_total,
            notes,
            status,
            stores (name, address)
          )
        `).eq("id", id).eq("user_id", user.id).single();
      if (error) throw error;
      if (!data) {
        toast$1({ variant: "destructive", title: "Order not found", description: "This order doesn't exist or you don't have access to it." });
        navigate("/store-pickup");
        return;
      }
      setOrder(data);
      const notes = {};
      const photos = {};
      (_a2 = data.pickup_order_stores) == null ? void 0 : _a2.forEach((storeOrder) => {
        notes[storeOrder.store_id] = storeOrder.notes || "";
        photos[storeOrder.store_id] = [];
      });
      setStoreNotes(notes);
      setStorePhotos(photos);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not load order details." });
      navigate("/store-pickup");
    } finally {
      setLoading(false);
    }
  };
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const currentMessages = order.admin_messages || [];
      const message = {
        from: "customer",
        message: newMessage.trim(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      const { error } = await supabase.from("pickup_orders").update({
        admin_messages: [...currentMessages, message]
      }).eq("id", id);
      if (error) throw error;
      setOrder((prev) => ({
        ...prev,
        admin_messages: [...currentMessages, message]
      }));
      setNewMessage("");
      toast$1({ title: "Message sent", description: "Your message has been sent to our team." });
    } catch (error) {
      console.error("Error sending message:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not send message." });
    } finally {
      setSendingMessage(false);
    }
  };
  const handleSaveStoreNotes = async (storeId, storeOrderId) => {
    setSavingNotes((prev) => ({ ...prev, [storeId]: true }));
    try {
      const { error } = await supabase.from("pickup_order_stores").update({ notes: storeNotes[storeId] }).eq("id", storeOrderId);
      if (error) throw error;
      toast$1({ title: "Notes saved", description: "Your shopping notes have been updated." });
      setOrder((prev) => ({
        ...prev,
        pickup_order_stores: prev.pickup_order_stores.map(
          (storeOrder) => storeOrder.id === storeOrderId ? { ...storeOrder, notes: storeNotes[storeId] } : storeOrder
        )
      }));
    } catch (error) {
      console.error("Error saving notes:", error);
      toast$1({ variant: "destructive", title: "Error", description: "Could not save notes." });
    } finally {
      setSavingNotes((prev) => ({ ...prev, [storeId]: false }));
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  if (!order) {
    return /* @__PURE__ */ jsxs("div", { className: "container py-8 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Order not found" }),
      /* @__PURE__ */ jsx(Link, { to: "/store-pickup", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Back to Grocery Runs"
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsx("div", { className: "container py-8", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-4xl mx-auto",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx(Link, { to: "/store-pickup", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "mb-4", children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
            "Back to Grocery Runs"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
                "Grocery Run #",
                order.id.slice(0, 6).toUpperCase()
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
                order.pickup_date ? format(new Date(order.pickup_date), "PPP") : "N/A",
                " • ",
                order.time_slot
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsxs(Badge, { className: getPaymentStatusColor(order.payment_status), children: [
                /* @__PURE__ */ jsx(CreditCard, {}),
                "  ",
                order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)
              ] }),
              /* @__PURE__ */ jsxs(Badge, { className: getStatusColor(order.status), children: [
                /* @__PURE__ */ jsx(Info, {}),
                "  ",
                order.status.charAt(0).toUpperCase() + order.status.slice(1)
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center", children: [
                /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 mr-2" }),
                "Order Summary"
              ] }) }),
              /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                    /* @__PURE__ */ jsx(Calendar$1, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                    order.pickup_date ? format(new Date(order.pickup_date), "PPP") : "N/A"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                    /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                    order.time_slot
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                    order.delivery_address
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                    /* @__PURE__ */ jsx(Phone, { className: "w-4 h-4 mr-2 text-muted-foreground" }),
                    order.whatsapp_number || order.phone_number
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Total Amount:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: order.actual_total ? formatCurrency(order.actual_total) : "(Est.)" + formatCurrency(order.estimated_total) })
                ] }),
                order.actual_total && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Actual Total:" }),
                  /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: formatCurrency(order.actual_total) })
                ] }),
                order.payment_status === "paid" && order.payment_data && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-green-50 border border-green-200 rounded", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-medium mb-1 text-green-800", children: "Payment Details:" }),
                  /* @__PURE__ */ jsx("pre", { className: "text-xs text-green-900 whitespace-pre-wrap break-all", children: JSON.stringify(order.payment_data, null, 2) })
                ] }),
                order.status !== "cancelled" && order.status !== "completed" && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-end", children: /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: async () => {
                  if (!window.confirm("Are you sure you want to cancel this order? Cancellation fees may apply")) return;
                  try {
                    const { error } = await supabase.from("pickup_orders").update({ status: "cancelled" }).eq("id", order.id);
                    if (error) throw error;
                    setOrder((prev) => ({ ...prev, status: "cancelled" }));
                    toast$1({ title: "Order Cancelled", description: "Your order has been cancelled." });
                  } catch (err) {
                    toast$1({ variant: "destructive", title: "Error", description: "Could not cancel order." });
                  }
                }, children: "Cancel Order" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center", children: [
                /* @__PURE__ */ jsx(Store, { className: "w-5 h-5 mr-2" }),
                "Store Orders"
              ] }) }),
              /* @__PURE__ */ jsx(CardContent, { className: "space-y-6", children: (_a = order.pickup_order_stores) == null ? void 0 : _a.map((storeOrder, index) => {
                var _a2, _b, _c;
                return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  index > 0 && /* @__PURE__ */ jsx(Separator, {}),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("h4", { className: "font-medium mb-0", children: (_a2 = storeOrder.stores) == null ? void 0 : _a2.name }),
                        /* @__PURE__ */ jsx(Badge, { className: getStatusColor(storeOrder.status), variant: "outline", children: storeOrder.status.charAt(0).toUpperCase() + storeOrder.status.slice(1) })
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: (_b = storeOrder.stores) == null ? void 0 : _b.address })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-medium", children: storeOrder.actual_total ? formatCurrency(storeOrder.actual_total) : formatCurrency(storeOrder.estimated_total) }),
                      storeOrder.actual_total && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
                        "Est: ",
                        formatCurrency(storeOrder.estimated_total)
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx(Label, { htmlFor: `notes-${storeOrder.store_id}`, children: "Shopping List / Notes" }),
                    /* @__PURE__ */ jsx(
                      Textarea,
                      {
                        id: `notes-${storeOrder.store_id}`,
                        value: storeNotes[storeOrder.store_id] || "",
                        onChange: (e) => setStoreNotes((prev) => ({
                          ...prev,
                          [storeOrder.store_id]: e.target.value
                        })),
                        placeholder: "Add your shopping list or special instructions for this store...",
                        rows: 3,
                        disabled: order.status === "completed" || order.status === "cancelled"
                      }
                    ),
                    order.status !== "completed" && order.status !== "cancelled" && /* @__PURE__ */ jsx(
                      Button,
                      {
                        size: "sm",
                        onClick: () => handleSaveStoreNotes(storeOrder.store_id, storeOrder.id),
                        disabled: savingNotes[storeOrder.store_id],
                        children: savingNotes[storeOrder.store_id] ? "Saving..." : "Save Notes"
                      }
                    )
                  ] }),
                  order.status !== "completed" && order.status !== "cancelled" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxs(Label, { children: [
                      "Photos for ",
                      (_c = storeOrder.stores) == null ? void 0 : _c.name
                    ] }),
                    /* @__PURE__ */ jsx(
                      PhotoUpload,
                      {
                        photos: storePhotos[storeOrder.store_id] || [],
                        onPhotosChange: (photos) => setStorePhotos((prev) => ({
                          ...prev,
                          [storeOrder.store_id]: photos
                        })),
                        maxPhotos: 5
                      }
                    )
                  ] })
                ] }, storeOrder.id);
              }) })
            ] }),
            order.photos && order.photos.length > 0 && /* @__PURE__ */ jsxs(Card, { children: [
              /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center", children: [
                /* @__PURE__ */ jsx(Camera, { className: "w-5 h-5 mr-2" }),
                "Your Photos"
              ] }) }),
              /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: order.photos.map((photo, index) => /* @__PURE__ */ jsx(
                "img",
                {
                  src: photo.data,
                  alt: `Photo ${index + 1}`,
                  className: "aspect-square rounded object-cover cursor-pointer",
                  onClick: () => window.open(photo.data, "_blank")
                },
                index
              )) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs(Card, { children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "w-5 h-5 mr-2" }),
              "Support"
            ] }) }),
            /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto", children: order.admin_messages && order.admin_messages.length > 0 ? order.admin_messages.map((message, index) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `p-3 rounded text-sm ${message.from === "admin" ? "bg-blue-50 border-l-4 border-blue-400 ml-4" : "bg-gray-50 border-l-4 border-gray-400 mr-4"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium", children: message.from === "admin" ? "Support Team" : "You" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: format(new Date(message.timestamp), "MMM d, HH:mm") })
                    ] }),
                    /* @__PURE__ */ jsx("p", { children: message.message })
                  ]
                },
                index
              )) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No messages yet. Send a message to our team if you have any questions." }) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { children: "Send a message:" }),
                /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
                  /* @__PURE__ */ jsx(
                    Textarea,
                    {
                      value: newMessage,
                      onChange: (e) => setNewMessage(e.target.value),
                      placeholder: "Type your message...",
                      rows: 2,
                      className: "flex-1"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      onClick: handleSendMessage,
                      disabled: !newMessage.trim() || sendingMessage,
                      size: "sm",
                      children: sendingMessage ? /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" })
                    }
                  )
                ] })
              ] })
            ] })
          ] }) })
        ] })
      ]
    }
  ) });
};
const PrivacyPage = () => {
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-3xl mx-auto",
      children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-6", children: "Privacy Policy" }),
        /* @__PURE__ */ jsxs("div", { className: "prose prose-slate max-w-none", children: [
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-6", children: "Last updated: May 24, 2025" }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "1. Information We Collect" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We collect information that you provide directly to us, including:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Name and contact information" }),
              /* @__PURE__ */ jsx("li", { children: "Delivery address" }),
              /* @__PURE__ */ jsx("li", { children: "Order history and preferences" }),
              /* @__PURE__ */ jsx("li", { children: "Payment information" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "2. How We Use Your Information" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We use the information we collect to:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Process and deliver your orders" }),
              /* @__PURE__ */ jsx("li", { children: "Send order confirmations and updates" }),
              /* @__PURE__ */ jsx("li", { children: "Improve our services" }),
              /* @__PURE__ */ jsx("li", { children: "Communicate with you about promotions and updates" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "3. Information Sharing" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We do not sell your personal information. We share your information only with:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Delivery partners to fulfill your orders" }),
              /* @__PURE__ */ jsx("li", { children: "Payment processors to handle transactions" }),
              /* @__PURE__ */ jsx("li", { children: "Service providers who assist our operations" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "4. Your Rights" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "You have the right to:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Access your personal information" }),
              /* @__PURE__ */ jsx("li", { children: "Correct inaccurate information" }),
              /* @__PURE__ */ jsx("li", { children: "Request deletion of your information" }),
              /* @__PURE__ */ jsx("li", { children: "Opt-out of marketing communications" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 flex justify-center", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Back to Home" }) }) })
      ]
    }
  ) });
};
const TermsPage = () => {
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-3xl mx-auto",
      children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-6", children: "Terms and Conditions" }),
        /* @__PURE__ */ jsxs("div", { className: "prose prose-slate max-w-none", children: [
          /* @__PURE__ */ jsx("p", { className: "text-lg text-muted-foreground mb-6", children: "Last updated: May 24, 2025" }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "1. Acceptance of Terms" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "By accessing and using Groceroo's services, you agree to be bound by these Terms and Conditions. These terms govern your use of our website, mobile application, and delivery services." })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "2. Service Description" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Groceroo provides an online grocery shopping and delivery service. We:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Accept orders for grocery items" }),
              /* @__PURE__ */ jsx("li", { children: "Process payments securely" }),
              /* @__PURE__ */ jsx("li", { children: "Deliver orders to specified addresses" }),
              /* @__PURE__ */ jsx("li", { children: "Offer store pickup services" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "3. Ordering and Delivery" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "When placing an order:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "You must provide accurate delivery information" }),
              /* @__PURE__ */ jsx("li", { children: "Orders are subject to product availability" }),
              /* @__PURE__ */ jsx("li", { children: "Delivery times are estimates and not guaranteed" }),
              /* @__PURE__ */ jsx("li", { children: "Minimum order values may apply" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "4. Pricing and Payment" }),
            /* @__PURE__ */ jsx("p", { className: "mb-4", children: "All prices are in AUD and include applicable taxes. Additional fees may apply:" }),
            /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
              /* @__PURE__ */ jsx("li", { children: "Delivery fees" }),
              /* @__PURE__ */ jsx("li", { children: "Service fees" }),
              /* @__PURE__ */ jsx("li", { children: "Special handling fees" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 flex justify-center", children: /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Back to Home" }) }) })
      ]
    }
  ) });
};
const StripePaymentPage = () => {
  var _a, _b;
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!cart.length) {
      navigate("/checkout");
      return;
    }
    const createPaymentIntent = async () => {
      var _a2;
      try {
        const productList = cart.map((item) => ({
          id: item.id,
          quantity: item.quantity
        }));
        const orderData2 = (_a2 = location.state) == null ? void 0 : _a2.orderData;
        const response = await fetch("https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-stripe-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY"
          },
          body: JSON.stringify({
            order_type: "delivery",
            productList,
            user_id: user.id,
            orderData: orderData2,
            orderId: null
            // delivery_type: location.state?.deliveryType || 'express',
            // scheduled_delivery_time: location.state?.scheduledTime || null
          })
        });
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setClientSecret(data.clientSecret);
        setOrderData(data.orderData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    createPaymentIntent();
  }, [cart, navigate, location.state, user.id]);
  const handlePaymentSuccess = async (data) => {
    try {
      const payment_data = data.payment_data;
      const orderDataComplete = {
        ...orderData,
        payment_data
      };
      const order = await addOrder(orderDataComplete);
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (error2) {
      console.error("Error creating order:", error2);
      setError("Failed to create order. Please contact support.");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "container py-8 text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-destructive mb-4", children: "Payment Error" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: error }),
      /* @__PURE__ */ jsx("button", { onClick: () => navigate("/checkout"), className: "text-primary hover:underline", children: "Return to checkout" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "Complete Payment" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 border rounded-lg bg-muted/30", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Order Total" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: formatCurrency(getCartTotal() + (((_a = location.state) == null ? void 0 : _a.deliveryFee) || 0) + (((_b = location.state) == null ? void 0 : _b.serviceFee) || 0)) })
      ] }),
      /* @__PURE__ */ jsx(
        StripeCheckoutForm,
        {
          clientSecret,
          onPaymentSuccess: handlePaymentSuccess
        }
      )
    ] })
  ] });
};
const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    toast$1({
      title: "Message Sent",
      description: "Thank you for your message. We'll get back to you soon!"
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-2xl mx-auto",
      children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: "Contact Us" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8", children: "Have questions or feedback? We'd love to hear from you." }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-8 md:grid-cols-2 mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Mail, { className: "w-6 h-6 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-medium", children: "Email" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "contact@groceroo.com.au" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-primary/10", children: /* @__PURE__ */ jsx(Phone, { className: "w-6 h-6 text-primary" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-medium", children: "Phone" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "+61 478 477 036" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Send us a message" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "name",
                    value: formData.name,
                    onChange: (e) => setFormData((prev) => ({ ...prev, name: e.target.value })),
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "email",
                    type: "email",
                    value: formData.email,
                    onChange: (e) => setFormData((prev) => ({ ...prev, email: e.target.value })),
                    required: true
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "subject", children: "Subject" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "subject",
                  value: formData.subject,
                  onChange: (e) => setFormData((prev) => ({ ...prev, subject: e.target.value })),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "message", children: "Message" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  id: "message",
                  rows: 5,
                  value: formData.message,
                  onChange: (e) => setFormData((prev) => ({ ...prev, message: e.target.value })),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" }),
              "Sending..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
              "Send Message"
            ] }) })
          ] })
        ] })
      ]
    }
  ) });
};
const WorkPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "driver",
    experience: "",
    availability: ""
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    toast$1({
      title: "Application Received",
      description: "Thank you for your interest! We'll review your application and get back to you soon."
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "driver",
      experience: "",
      availability: ""
    });
    setLoading(false);
  };
  return /* @__PURE__ */ jsx("div", { className: "container px-4 py-8 mx-auto md:px-6", children: /* @__PURE__ */ jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "max-w-2xl mx-auto",
      children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2", children: "Work With Us" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-8", children: "Join our team and be part of Adelaide's growing grocery delivery service." }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 border rounded-lg", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold mb-4", children: "Expression of Interest" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Full Name" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "name",
                    value: formData.name,
                    onChange: (e) => setFormData((prev) => ({ ...prev, name: e.target.value })),
                    required: true
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Email" }),
                /* @__PURE__ */ jsx(
                  Input,
                  {
                    id: "email",
                    type: "email",
                    value: formData.email,
                    onChange: (e) => setFormData((prev) => ({ ...prev, email: e.target.value })),
                    required: true
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "phone", children: "Phone Number" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "phone",
                  type: "tel",
                  value: formData.phone,
                  onChange: (e) => setFormData((prev) => ({ ...prev, phone: e.target.value })),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { children: "Position of Interest" }),
              /* @__PURE__ */ jsxs(
                RadioGroup,
                {
                  value: formData.position,
                  onValueChange: (value) => setFormData((prev) => ({ ...prev, position: value })),
                  className: "flex space-x-4",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsx(RadioGroupItem, { value: "driver", id: "driver" }),
                      /* @__PURE__ */ jsx(Label, { htmlFor: "driver", children: "Delivery Driver" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                      /* @__PURE__ */ jsx(RadioGroupItem, { value: "assistant", id: "assistant" }),
                      /* @__PURE__ */ jsx(Label, { htmlFor: "assistant", children: "In-Store Assistant" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "experience", children: "Relevant Experience" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  id: "experience",
                  rows: 3,
                  value: formData.experience,
                  onChange: (e) => setFormData((prev) => ({ ...prev, experience: e.target.value })),
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "availability", children: "Availability" }),
              /* @__PURE__ */ jsx(
                Textarea,
                {
                  id: "availability",
                  rows: 2,
                  value: formData.availability,
                  onChange: (e) => setFormData((prev) => ({ ...prev, availability: e.target.value })),
                  placeholder: "Please specify your available days and hours",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" }),
              "Submitting..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Send, { className: "w-4 h-4 mr-2" }),
              "Submit Application"
            ] }) })
          ] })
        ] })
      ]
    }
  ) });
};
const App = () => {
  return /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(OrderProvider, { children: /* @__PURE__ */ jsx(CartProvider, { children: /* @__PURE__ */ jsx(BrowserRouter, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen bg-background font-sans antialiased", children: [
    /* @__PURE__ */ jsx(Header, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxs(Routes, { children: [
      /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(HomePage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/shop", element: /* @__PURE__ */ jsx(ShopPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/categories", element: /* @__PURE__ */ jsx(CategoriesPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/category/:id", element: /* @__PURE__ */ jsx(CategoryPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/product/:id", element: /* @__PURE__ */ jsx(ProductPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/checkout", element: /* @__PURE__ */ jsx(CheckoutPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/store-pickup", element: /* @__PURE__ */ jsx(StorePickupPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/pickup-payment", element: /* @__PURE__ */ jsx(PickupPaymentPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/pickup-order/:id", element: /* @__PURE__ */ jsx(PickupOrderDetailsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/order-confirmation/:id", element: /* @__PURE__ */ jsx(OrderConfirmationPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/admin-login", element: /* @__PURE__ */ jsx(AdminLoginPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/register", element: /* @__PURE__ */ jsx(RegisterPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/account/*", element: /* @__PURE__ */ jsx(AccountPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/privacy", element: /* @__PURE__ */ jsx(PrivacyPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/terms", element: /* @__PURE__ */ jsx(TermsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/stripe-payment", element: /* @__PURE__ */ jsx(StripePaymentPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/contact", element: /* @__PURE__ */ jsx(ContactPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "/work", element: /* @__PURE__ */ jsx(WorkPage, {}) })
    ] }) }) }),
    /* @__PURE__ */ jsx(Footer, {}),
    /* @__PURE__ */ jsx(CartDrawer, {}),
    /* @__PURE__ */ jsx(Toaster, {})
  ] }) }) }) }) });
};
ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  /* @__PURE__ */ jsx(App, {})
  // </React.StrictMode> 
);
