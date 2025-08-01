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
  const [statusFilter, setStatusFilter] = useState('processing');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  // Bill modal state
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillEditor, setShowBillEditor] = useState(false);
  const [billForm, setBillForm] = useState({ id: '', items: [], total: '', created_at: '', image: '' });
  const logoUrl = '/logo.webp';
  const [billImageFile, setBillImageFile] = useState(null);

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

  const handleDownloadBillPDF = (bill) => {
    if (bill.image) {
      // Download image
      const link = document.createElement('a');
      link.href = bill.image;
      link.download = `bill_${selectedOrder.id}_${bill.id || ''}.jpg`;
      link.click();
    } else {
      import('@/lib/generateBill').then(({ generateBillPDF }) => {
        const doc = generateBillPDF({ order: selectedOrder, bill, logoUrl });
        doc.save(`bill_${selectedOrder.id}_${bill.id || ''}.pdf`);
      });
    }
  };

  const handleEditBill = (bill) => {
    setBillForm({
      id: bill?.id || '',
      items: bill?.items || [],
      total: bill?.total || '',
      created_at: bill?.created_at || new Date().toISOString(),
      image: bill?.image || ''
    });
    setBillImageFile(null);
    setShowBillEditor(true);
  };

  const handleBillFormChange = (field, value) => {
    setBillForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBillItemChange = (idx, field, value) => {
    setBillForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const handleAddBillItem = () => {
    setBillForm(prev => ({ ...prev, items: [...prev.items, { name: '', quantity: 1, price: 0 }] }));
  };

  const handleRemoveBillItem = (idx) => {
    setBillForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleRemoveBill = async (billId) => {
    const updatedBills = (selectedOrder.bills || []).filter(b => b.id !== billId);
    await supabase.from('orders').update({ bills: updatedBills }).eq('id', selectedOrder.id);
    setSelectedOrder({ ...selectedOrder, bills: updatedBills });
    toast({ title: 'Bill removed', description: 'Bill has been deleted.' });
  };

  const handleBillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Upload to supabase storage
    const fileName = `bill_${selectedOrder.id}_${Date.now()}`;
    const { data, error } = await supabase.storage.from('bills').upload(fileName, file, { upsert: true });
    if (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      return;
    }
    const imageUrl = supabase.storage.from('bills').getPublicUrl(fileName).publicUrl;
    setBillForm(prev => ({ ...prev, image: imageUrl }));
    setBillImageFile(file);
  };

  const handleSaveBill = async () => {
    const updatedBills = selectedOrder.bills ? [...selectedOrder.bills] : [];
    if (billForm.id) {
      // Edit existing
      const idx = updatedBills.findIndex(b => b.id === billForm.id);
      if (idx !== -1) updatedBills[idx] = billForm;
      else updatedBills.push(billForm);
    } else {
      // New bill
      billForm.id = Math.random().toString(36).slice(2, 10).toUpperCase();
      updatedBills.push(billForm);
    }
    await supabase.from('orders').update({ bills: updatedBills }).eq('id', selectedOrder.id);
    setSelectedOrder({ ...selectedOrder, bills: updatedBills });
    setShowBillEditor(false);
    toast({ title: 'Bill saved', description: 'Bill has been updated.' });
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
              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
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
                                  <p><strong>Notes:</strong> {selectedOrder.delivery_notes}</p>
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
                                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
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

                            {/* Bills */}
                            {selectedOrder?.bills && selectedOrder.bills.length > 0 ? (
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">Bills</h4>
                                <div className="space-y-2">
                                  {selectedOrder.bills.map((bill, idx) => (
                                    <div key={bill.id || idx} className="flex items-center justify-between p-2 border rounded">
                                      <span>Bill #{bill.id ? bill.id.slice(0,6).toUpperCase() : idx+1}</span>
                                      <Button variant="outline" onClick={() => setSelectedBill(bill)}>
                                        View Bill
                                      </Button>
                                      <Button variant="secondary" onClick={() => handleDownloadBillPDF(bill)}>
                                        Download PDF
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">Bills</h4>
                                <div className="text-muted-foreground mb-2">No bills found for this order.</div>
                                <Button variant="primary" onClick={() => {
                                  setSelectedOrder(order);
                                  setBillForm({
                                    id: '',
                                    items: [],
                                    total: order.total || '',
                                    created_at: new Date().toISOString(),
                                    image: ''
                                  });
                                  setShowBillEditor(true);
                                }}>
                                  Generate Bill
                                </Button>
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
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
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

      {selectedBill && (
        <Dialog open={!!selectedBill} onOpenChange={open => { if (!open) setSelectedBill(null); }}>
          <DialogContent className="max-w-md w-full sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bill Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedBill.image ? (
                <img src={selectedBill.image} alt="Bill" className="w-64 mx-auto" />
              ) : selectedBill.items && selectedBill.items.length > 0 ? (
                <>
                  <img src={logoUrl} alt="Logo" className="w-24 mb-2 mx-auto" />
                  <div>Bill ID: {selectedBill.id}</div>
                  <div>Date: {new Date(selectedBill.created_at).toLocaleString()}</div>
                  <div>Total: {formatCurrency(selectedBill.total)}</div>
                  <div>
                    <h4 className="font-semibold">Items</h4>
                    <ul className="list-disc ml-4">
                      {selectedBill.items.map((item, i) => (
                        <li key={i}>{item.name} x{item.quantity} - {formatCurrency(item.price)}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">Bill unavailable</div>
              )}
            </div>
            <Button onClick={() => handleDownloadBillPDF(selectedBill)}>
              Download {selectedBill.image ? 'Image' : 'PDF'}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {showBillEditor && (
        <Dialog open={showBillEditor} onOpenChange={open => { if (!open) setShowBillEditor(false); }}>
          <DialogContent className="max-w-md w-full sm:max-w-lg md:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{billForm.id ? 'Edit Bill' : 'Generate Bill'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Bill ID</Label>
              <Input value={billForm.id} disabled />
              <Label>Date</Label>
              <Input type="datetime-local" value={billForm.created_at.slice(0,16)} onChange={e => handleBillFormChange('created_at', e.target.value)} />
              <Label>Total</Label>
              <Input type="number" value={billForm.total} onChange={e => handleBillFormChange('total', e.target.value)} />
              <Label>Items</Label>
              {billForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input placeholder="Name" value={item.name} onChange={e => handleBillItemChange(idx, 'name', e.target.value)} />
                  <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleBillItemChange(idx, 'quantity', e.target.value)} />
                  <Input type="number" placeholder="Price" value={item.price} onChange={e => handleBillItemChange(idx, 'price', e.target.value)} />
                  <Button variant="destructive" onClick={() => handleRemoveBillItem(idx)}>Remove</Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddBillItem}>Add Item</Button>
              <Label className="mt-4">Or upload bill image (jpg/png):</Label>
              <Input type="file" accept="image/*" onChange={handleBillImageUpload} />
              {billForm.image && (
                <img src={billForm.image} alt="Bill" className="w-32 mt-2" />
              )}
            </div>
            <Button className="mt-4" onClick={handleSaveBill}>Save Bill</Button>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default AdminOrdersTab;