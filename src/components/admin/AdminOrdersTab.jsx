import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Package, CreditCard, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import OrderItem from '@/components/admin/OrderItem';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { getCurrentDateInTimezone, DEFAULT_TIMEZONE } from '@/lib/timezone';

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  useEffect(() => {
    fetchTimezone();
    fetchOrders();
    
    // Set up auto-refresh every minute
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchTimezone = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('timezone')
        .eq('id', 1)
        .single();

      if (!error && data?.timezone) {
        setTimezone(data.timezone);
      }
    } catch (error) {
      console.error('Error fetching timezone:', error);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => {});
  };

  const fetchOrders = async (isRefresh = false) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (isRefresh && orders.length > 0 && data.length > orders.length) {
        playNotificationSound();
        toast({ title: "New Order", description: "A new order has been received!" });
      }
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load orders." });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({ title: "Status Updated", description: `Order status changed to ${status}` });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not update order status." });
    }
  };

  const updateDeliveryTime = async (orderId, expectedDeliveryAt) => {
    const currentTime = getCurrentDateInTimezone(timezone);
    const deliveryTime = new Date(expectedDeliveryAt);
    
    if (deliveryTime <= currentTime) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Delivery time cannot be in the past." });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ expected_delivery_at: expectedDeliveryAt })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({ title: "Delivery Time Updated", description: "Expected delivery time has been updated" });
      fetchOrders();
    } catch (error) {
      console.error('Error updating delivery time:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not update delivery time." });
    }
  };

  const confirmPaymentWithActualAmount = async () => {
    if (!actualAmount || !selectedOrder) return;

    setConfirmingPayment(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'confirmed',
          status: 'processing',
          fees_data: {
            actual_amount: parseFloat(actualAmount),
            confirmed_at: new Date().toISOString()
          }
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Payment Confirmed", 
        description: `Payment confirmed with actual amount ${formatCurrency(parseFloat(actualAmount))}` 
      });

      setActualAmount('');
      fetchOrders();
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({ 
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
        from: 'admin',
        message: adminMessage,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update({
          admin_messages: [...currentMessages, newMessage]
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({ title: "Message Sent", description: "Your message has been sent to the customer." });
      setAdminMessage('');
      fetchOrders();
      
      setSelectedOrder({
        ...selectedOrder,
        admin_messages: [...currentMessages, newMessage]
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Orders Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search orders..." 
              className="pl-8 w-full md:w-[200px]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Package className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No orders found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium">Order #{order.id.slice(0, 6).toUpperCase()}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    <p className="text-sm">{order.customer_name} - {order.customer_email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatCurrency(order.total)}</span>
                    <Dialog open={isDetailDialogOpen && selectedOrder?.id === order.id} onOpenChange={setIsDetailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - {selectedOrder?.id.slice(0, 6).toUpperCase()}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedOrder && (
                          <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Customer Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                                  <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                  <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                                  <p><strong>Address:</strong> {selectedOrder.customer_address}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Order Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Status:</strong> {selectedOrder.status}</p>
                                  <p><strong>Payment:</strong> {selectedOrder.payment_status}</p>
                                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.total)}</p>
                                  {selectedOrder.fees_data?.delivery_fee && (
                                    <p><strong>Delivery Fee:</strong> {formatCurrency(selectedOrder.fees_data?.delivery_fee)}</p>
                                  )}
                                  {selectedOrder.fees_data?.service_fee && (
                                    <p><strong>Service Fee:</strong> {formatCurrency(selectedOrder.fees_data.service_fee)}</p>
                                  )}
                                  {selectedOrder.discount_amount > 0 && (
                                    <p><strong>Discount:</strong> -{formatCurrency(selectedOrder.discount_amount)}</p>
                                  )}
                                  {selectedOrder.promo_code && (
                                    <p><strong>Promo Code:</strong> {selectedOrder.promo_code}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Update */}
                            <div className="space-y-2">
                              <Label>Update Status</Label>
                              <Select 
                                value={selectedOrder.status} 
                                onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Delivery Time Update */}
                            <div className="space-y-2">
                              <Label>Expected Delivery Time</Label>
                              <Input
                                type="datetime-local"
                                value={selectedOrder.expected_delivery_at ? new Date(selectedOrder.expected_delivery_at).toISOString().slice(0, 16) : ''}
                                onChange={(e) => updateDeliveryTime(selectedOrder.id, e.target.value)}
                              />
                            </div>

                            {/* Payment Confirmation */}
                            {selectedOrder.payment_status === 'paid' && (
                              <div className="p-4 border rounded-lg bg-blue-50">
                                <h4 className="font-semibold mb-2 flex items-center">
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Confirm Payment with Actual Amount
                                </h4>
                                <div className="flex space-x-2 items-end">
                                  <div className="flex-1">
                                    <Label htmlFor="actual-amount">Actual Total Amount ($)</Label>
                                    <Input
                                      id="actual-amount"
                                      type="number"
                                      step="0.01"
                                      value={actualAmount}
                                      onChange={(e) => setActualAmount(e.target.value)}
                                      placeholder="Enter actual total amount"
                                    />
                                  </div>
                                  <Button
                                    onClick={confirmPaymentWithActualAmount}
                                    disabled={!actualAmount || confirmingPayment}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {confirmingPayment ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {confirmingPayment ? 'Confirming...' : 'Confirm Payment'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Order Items */}
                            <div>
                              <h4 className="font-semibold mb-2">Order Items</h4>
                              <div className="space-y-2">
                                {selectedOrder.items?.map((item, index) => (
                                  <div key={index} className="flex justify-between p-2 bg-muted rounded">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Messages */}
                            <div>
                              <h4 className="font-semibold mb-2">Messages</h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                                {selectedOrder.admin_messages?.map((message, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded text-sm ${
                                      message.from === 'admin' 
                                        ? 'bg-blue-50 border-l-4 border-blue-400 ml-4' 
                                        : 'bg-gray-50 border-l-4 border-gray-400 mr-4'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <span className="font-medium">
                                        {message.from === 'admin' ? 'You' : 'Customer'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(message.timestamp).toLocaleString()}
                                      </span>
                                    </div>
                                    <p>{message.message}</p>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Send message to customer:</Label>
                                <div className="flex space-x-2">
                                  <Textarea
                                    value={adminMessage}
                                    onChange={(e) => setAdminMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={2}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={sendAdminMessage}
                                    disabled={!adminMessage.trim()}
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="text-sm text-muted-foreground">
                    {order.delivery_type} • {order.customer_address}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminOrdersTab;