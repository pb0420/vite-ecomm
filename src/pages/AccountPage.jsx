import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, LogOut, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import AddressManager from '@/components/account/AddressManager';
import UpcomingOrders from '@/components/pickup/UpcomingOrders';

const AccountPage = () => {
  const { user, updateUserInfo, logout, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pickupOrders, setPickupOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      fetchUserOrders(user.id);
      fetchPickupOrders(user.id);
    }
  }, [user, authLoading, navigate]);

  const fetchUserOrders = async (userId) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchPickupOrders = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('pickup_orders')
        .select(`
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
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPickupOrders(data || []);
    } catch (error) {
      console.error('Error fetching pickup orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSendMessage = async (orderId, message) => {
    try {
      // Get current order
      const { data: currentOrder, error: fetchError } = await supabase
        .from('pickup_orders')
        .select('admin_messages')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentMessages = currentOrder.admin_messages || [];
      const newMessage = {
        from: 'customer',
        message: message,
        timestamp: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          admin_messages: [...currentMessages, newMessage]
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Refresh pickup orders to show new message
      fetchPickupOrders(user.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Update profile info including email
      await updateUserInfo({
        name: formData.name,
        email: formData.email,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
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
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'delivered': case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  if (authLoading) {
    return <div className="container flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold tracking-tight mb-6"
      >
        My Account
      </motion.h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />Profile
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center">
            <Package className="w-4 h-4 mr-2" />Orders
          </TabsTrigger>
          <TabsTrigger value="grocery-runs" className="flex items-center">
            <Store className="w-4 h-4 mr-2" />Grocery Runs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 border rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className={errors.name ? 'border-destructive' : ''} 
                    disabled={isSubmitting} 
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className={errors.email ? 'border-destructive' : ''} 
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  className="bg-muted/50" 
                  disabled={true} 
                />
                <p className="text-xs text-muted-foreground">Phone number cannot be changed.</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 border rounded-lg"
          >
            <AddressManager />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-6 border rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <Button
              variant="destructive"
              className="flex items-center"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Delivery Orders</h2>
              {loadingOrders ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No delivery orders yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Start shopping to place your first order.</p>
                  <Link to="/shop"><Button className="mt-4">Start Shopping</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <Link key={order.id} to={`/order-confirmation/${order.id}`} className="block p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">Order #{order.id.substring(0, 8)}...</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)} • {formatCurrency(order.total)}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-right">
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="grocery-runs" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="p-6 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Grocery Runs</h2>
                <Link to="/store-pickup">
                  <Button>Schedule New Run</Button>
                </Link>
              </div>
              {loadingOrders ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <UpcomingOrders 
                  orders={pickupOrders} 
                  onSendMessage={handleSendMessage}
                />
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountPage;