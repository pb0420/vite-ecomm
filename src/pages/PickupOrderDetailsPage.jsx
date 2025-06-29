import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, Store, MessageCircle, Camera, Send, Package, MapPin, Phone, CreditCard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PhotoUpload from '@/components/pickup/PhotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CancelOrderDialog from '@/components/common/CancelOrderDialog';

const PickupOrderDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [storeNotes, setStoreNotes] = useState({});
  const [storePhotos, setStorePhotos] = useState({});
  const [savingNotes, setSavingNotes] = useState({});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/grocery-run');
      return;
    }
    fetchOrderDetails();
  }, [id, user, navigate]);

  const fetchOrderDetails = async () => {
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
            stores (name, address, store_suggested_items)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (!data) {
        toast({ variant: "destructive", title: "Order not found", description: "This order doesn't exist or you don't have access to it." });
        navigate('/grocery-run');
        return;
      }

      setOrder(data);
      
      // Initialize store notes and photos
      const notes = {};
      const photos = {};
      data.pickup_order_stores?.forEach(storeOrder => {
        notes[storeOrder.store_id] = storeOrder.notes || '';
        photos[storeOrder.store_id] = []; // Initialize empty for now
      });
      setStoreNotes(notes);
      setStorePhotos(photos);
      
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load order details." });
      navigate('/grocery-run');
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
        from: 'customer',
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('pickup_orders')
        .update({
          admin_messages: [...currentMessages, message]
        })
        .eq('id', id);

      if (error) throw error;

      setOrder(prev => ({
        ...prev,
        admin_messages: [...currentMessages, message]
      }));
      
      setNewMessage('');
      toast({ title: "Message sent", description: "Your message has been sent to our team." });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveStoreNotes = async (storeId, storeOrderId) => {
    setSavingNotes(prev => ({ ...prev, [storeId]: true }));
    try {
      const { error } = await supabase
        .from('pickup_order_stores')
        .update({ notes: storeNotes[storeId] })
        .eq('id', storeOrderId);

      if (error) throw error;

      toast({ title: "Notes saved", description: "Your shopping notes have been updated." });
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        pickup_order_stores: prev.pickup_order_stores.map(storeOrder =>
          storeOrder.id === storeOrderId 
            ? { ...storeOrder, notes: storeNotes[storeId] }
            : storeOrder
        )
      }));
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not save notes." });
    } finally {
      setSavingNotes(prev => ({ ...prev, [storeId]: false }));
    }
  };

  const handleCancelOrder = async (reason) => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('pickup_orders')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', order.id);
      if (error) throw error;
      setOrder(prev => ({ ...prev, status: 'cancelled', cancel_reason: reason }));
      toast({ title: 'Order Cancelled', description: 'Your order has been cancelled.' });
      setShowCancelDialog(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel order.' });
    } finally {
      setCancelling(false);
    }
  };

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

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Order not found</h2>
        <Link to="/grocery-run">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Grocery Run
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          {/* Link to go back */}
          <Link to="/account">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Account
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div style={{ flex: 1 }}>
              <h1 className="text-2xl font-bold">Grocery Run #{order.id.slice(0, 6).toUpperCase()}</h1>
              <p className="text-muted-foreground">
                {order.pickup_date ? format(new Date(order.pickup_date), 'PPP') : 'N/A'} • {order.time_slot}
              </p>
            </div>
            <div className="flex items-center space-x-4 ">
              <Badge className={getPaymentStatusColor(order.payment_status)}>
                <CreditCard />&nbsp; {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Badge>
              <Badge className={getStatusColor(order.status)}>
               <Info />&nbsp; {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    {order.pickup_date ? format(new Date(order.pickup_date), 'PPP') : 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    {order.time_slot}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    {order.delivery_address}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {order.whatsapp_number || order.phone_number}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {order.actual_total ? formatCurrency(order.actual_total) : '(Est.)' + formatCurrency(order.estimated_total)}
                  </span>
                </div>
                {order.actual_total && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Actual Total:</span>
                    <span className="text-base font-semibold">{formatCurrency(order.actual_total)}</span>
                  </div>
                )}
                {/* Show convenience, service, and delivery fees */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-muted-foreground">Convenience Fee ({order.fees_data?.convenience_fee_percent}) :</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.convenienceFee || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Service Fee ({order.fees_data?.service_fee_percent}) :</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.serviceFee || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivery Fee:</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.deliveryFee || 0)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Store Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Store Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {order.pickup_order_stores?.map((storeOrder, index) => (
                  <div key={storeOrder.id} className="space-y-4">
                    {index > 0 && <Separator />}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium mb-0">{storeOrder.stores?.name}</h4>
                          <Badge className={getStatusColor(storeOrder.status)} variant="outline">
                            {storeOrder.status.charAt(0).toUpperCase() + storeOrder.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{storeOrder.stores?.address}</p>
                        {/* Suggested Items */}
                        {Array.isArray(storeOrder.stores?.store_suggested_items) && storeOrder.stores.store_suggested_items.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold">Suggested Items:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {storeOrder.stores.store_suggested_items.map((item, idx) => {
                                const regex = new RegExp(`${item.name} x(\\d+)`, 'g');
                                const match = (storeNotes[storeOrder.store_id] || '').match(regex);
                                const selectedQty = match ? parseInt(match[0].split('x')[1], 10) : 1;
                                const checked = !!match;
                                return (
                                  <div key={item.name} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={e => {
                                        let notes = storeNotes[storeOrder.store_id] || '';
                                        const itemLine = `${item.name} x${selectedQty}`;
                                        if (e.target.checked) {
                                          // Add or update
                                          if (regex.test(notes)) {
                                            notes = notes.replace(regex, itemLine);
                                          } else {
                                            notes = notes ? `${notes}\n${itemLine}` : itemLine;
                                          }
                                        } else {
                                          // Remove
                                          notes = notes.replace(regex, '').replace(/^\s*[\r\n]/gm, '').trim();
                                        }
                                        setStoreNotes(prev => ({ ...prev, [storeOrder.store_id]: notes }));
                                      }}
                                      disabled={order.status === 'completed' || order.status === 'cancelled'}
                                    />
                                    <span className="text-xs">{item.name} : Qty&nbsp;</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={selectedQty}
                                      onChange={e => {
                                        let notes = storeNotes[storeOrder.store_id] || '';
                                        const qty = Math.max(1, parseInt(e.target.value) || 1);
                                        const itemLine = `${item.name} x${qty}`;
                                        if (regex.test(notes)) {
                                          notes = notes.replace(regex, itemLine);
                                        } else {
                                          notes = notes ? `${notes}\n${itemLine}` : itemLine;
                                        }
                                        setStoreNotes(prev => ({ ...prev, [storeOrder.store_id]: notes }));
                                      }}
                                      className="w-10 text-xs ml-1 border rounded px-1 py-0.5"
                                      disabled={!checked || order.status === 'completed' || order.status === 'cancelled'}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {storeOrder.actual_total 
                            ? formatCurrency(storeOrder.actual_total) 
                            : formatCurrency(storeOrder.estimated_total)
                          }
                        </p>
                        {storeOrder.actual_total && (
                          <p className="text-xs text-muted-foreground">
                            Est: {formatCurrency(storeOrder.estimated_total)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Store Notes */}
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${storeOrder.store_id}`}>Shopping List / Notes</Label>
                      <Textarea
                        id={`notes-${storeOrder.store_id}`}
                        value={storeNotes[storeOrder.store_id] || ''}
                        onChange={(e) => setStoreNotes(prev => ({
                          ...prev,
                          [storeOrder.store_id]: e.target.value
                        }))}
                        placeholder="Add your shopping list or special instructions for this store..."
                        rows={3}
                        disabled={order.status === 'completed' || order.status === 'cancelled'}
                      />
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => handleSaveStoreNotes(storeOrder.store_id, storeOrder.id)}
                          disabled={savingNotes[storeOrder.store_id]}
                        >
                          {savingNotes[storeOrder.store_id] ? 'Saving...' : 'Save Notes'}
                        </Button>
                      )}
                    </div>

                    {/* Store Photos */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <div className="space-y-2">
                        <Label>Photos for {storeOrder.stores?.name}</Label>
                        <PhotoUpload
                          photos={storePhotos[storeOrder.store_id] || []}
                          onPhotosChange={(photos) => setStorePhotos(prev => ({
                            ...prev,
                            [storeOrder.store_id]: photos
                          }))}
                          maxPhotos={5}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Global Photos */}
            {order.photos && order.photos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Your Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {order.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.data}
                        alt={`Photo ${index + 1}`}
                        className="aspect-square rounded object-cover cursor-pointer"
                        onClick={() => window.open(photo.data, '_blank')}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {order.admin_messages && order.admin_messages.length > 0 ? (
                    order.admin_messages.map((message, index) => (
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
                            {message.from === 'admin' ? 'Support Team' : 'You'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.timestamp), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        <p>{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Send a message to our team if you have any questions.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Send a message:</Label>
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      size="sm"
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Order Button at the bottom */}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <CancelOrderDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelOrder}
          loading={cancelling}
        />
      </motion.div>
    </div>
  );
};

export default PickupOrderDetailsPage;