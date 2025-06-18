import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Phone, MessageCircle, Eye, Store, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const AdminPickupOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pickup_orders')
        .select(`
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching pickup orders:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load pickup orders." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('pickup_orders')
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

  const updateStoreOrderStatus = async (storeOrderId, status) => {
    try {
      const { error } = await supabase
        .from('pickup_order_stores')
        .update({ status })
        .eq('id', storeOrderId);

      if (error) throw error;
      
      toast({ title: "Store Status Updated", description: `Store order status changed to ${status}` });
      fetchOrders();
      
      // Refresh selected order details
      if (selectedOrder) {
        const updatedOrder = orders.find(o => o.id === selectedOrder.id);
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating store order status:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not update store order status." });
    }
  };

  const confirmPaymentWithActualAmount = async () => {
    if (!actualAmount || !selectedOrder) return;

    setConfirmingPayment(true);
    try {
      // Call edge function to confirm payment intent with actual amount
      const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/confirm-pickup-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
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

      // Update order with actual total
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({ 
          actual_total: parseFloat(actualAmount),
          payment_status: 'confirmed',
          status: 'completed'
        })
        .eq('id', selectedOrder.id);

      if (updateError) throw updateError;

      toast({ 
        title: "Payment Confirmed", 
        description: `Payment confirmed with actual amount ${formatCurrency(parseFloat(actualAmount))}` 
      });

      setActualAmount('');
      fetchOrders();
      
      // Update selected order
      setSelectedOrder({
        ...selectedOrder,
        actual_total: parseFloat(actualAmount),
        payment_status: 'confirmed',
        status: 'completed'
      });
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
        .from('pickup_orders')
        .update({
          admin_messages: [...currentMessages, newMessage]
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({ title: "Message Sent", description: "Your message has been sent to the customer." });
      setAdminMessage('');
      fetchOrders();
      
      // Update selected order
      setSelectedOrder({
        ...selectedOrder,
        admin_messages: [...currentMessages, newMessage]
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };

  const openWhatsApp = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.whatsapp_number?.includes(searchTerm) ||
      order.phone_number?.includes(searchTerm) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Multi-Store Pickup Orders</h2>
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
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stores</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">No orders found.</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 6)}...</TableCell>
                    <TableCell>{order.profiles?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.pickup_order_stores?.map((storeOrder, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {storeOrder.stores?.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {order.pickup_date ? format(new Date(order.pickup_date), 'MMM d') : 'N/A'}
                        </div>
                        <div className="text-muted-foreground">{order.time_slot}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.whatsapp_number && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => openWhatsApp(order.whatsapp_number)}
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        )}
                        {order.phone_number && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => window.open(`tel:${order.phone_number}`)}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.actual_total ? formatCurrency(order.actual_total) : formatCurrency(order.estimated_total || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order Details - {selectedOrder?.id.slice(0, 6)}...</DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Customer Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Customer Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Name:</strong> {selectedOrder.profiles?.name}</p>
                                    <p><strong>WhatsApp:</strong> {selectedOrder.whatsapp_number || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selectedOrder.phone_number || 'N/A'}</p>
                                    <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>
                                    <p><strong>Postcode:</strong> {selectedOrder.postcode}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Order Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Date:</strong> {selectedOrder.pickup_date ? format(new Date(selectedOrder.pickup_date), 'PPP') : 'N/A'}</p>
                                    <p><strong>Time Slot:</strong> {selectedOrder.time_slot}</p>
                                    <p><strong>Status:</strong> 
                                      <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                      </Badge>
                                    </p>
                                    <p><strong>Payment:</strong> 
                                      <Badge className={`ml-2 ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                                        {selectedOrder.payment_status}
                                      </Badge>
                                    </p>
                                    <p><strong>Estimated Total:</strong> {formatCurrency(selectedOrder.estimated_total || 0)}</p>
                                    {selectedOrder.actual_total && (
                                      <p><strong>Actual Total:</strong> {formatCurrency(selectedOrder.actual_total)}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Payment Confirmation Section */}
                              {selectedOrder.payment_status === 'paid' && !selectedOrder.actual_total && (
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

                              {/* Store Orders */}
                              <div>
                                <h4 className="font-semibold mb-2">Store Orders</h4>
                                <div className="space-y-4">
                                  {selectedOrder.pickup_order_stores?.map((storeOrder, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <h5 className="font-medium">{storeOrder.stores?.name}</h5>
                                          <p className="text-sm text-muted-foreground">{storeOrder.stores?.address}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium">{formatCurrency(storeOrder.estimated_total || 0)}</p>
                                          <Select
                                            value={storeOrder.status}
                                            onValueChange={(value) => updateStoreOrderStatus(storeOrder.id, value)}
                                          >
                                            <SelectTrigger className="w-[120px] mt-1">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">Pending</SelectItem>
                                              <SelectItem value="confirmed">Confirmed</SelectItem>
                                              <SelectItem value="processing">Processing</SelectItem>
                                              <SelectItem value="ready">Ready</SelectItem>
                                              <SelectItem value="completed">Completed</SelectItem>
                                              <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      {storeOrder.notes && (
                                        <div className="mt-2">
                                          <p className="text-sm font-medium">Shopping List:</p>
                                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1">
                                            {storeOrder.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Photos */}
                              {selectedOrder.photos && selectedOrder.photos.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Customer Photos</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {selectedOrder.photos.map((photo, index) => (
                                      <img
                                        key={index}
                                        src={photo.data}
                                        alt={`Photo ${index + 1}`}
                                        className="aspect-square rounded object-cover cursor-pointer"
                                        onClick={() => window.open(photo.data, '_blank')}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

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
                                          {format(new Date(message.timestamp), 'MMM d, HH:mm')}
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
                                      Send
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPickupOrdersTab;