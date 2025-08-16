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
import useSupabaseStorage from '@/hooks/useSupabaseStorage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import CancelOrderDialog from '@/components/common/CancelOrderDialog';
import OrderMessaging from '@/components/common/OrderMessaging';
import StoreNotes from '@/components/common/StoreNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  // Bill modal state
  const [selectedBill, setSelectedBill] = useState(null);
  const logoUrl = '/logo.webp';

  const { uploadFile } = useSupabaseStorage();
  // Store photo viewer state
  const [photoViewer, setPhotoViewer] = useState({ open: false, images: [], index: 0 });

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

  // PDF download handler
  const handleDownloadBillPDF = (bill) => {
    import('../lib/generateBill').then(({ generateBillPDF }) => {
      const doc = generateBillPDF({ order, bill, logoUrl });
      doc.save(`bill_${order.id}_${bill.id || ''}.pdf`);
    });
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
    <div className="container py-6">
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
            <Button variant="ghost" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Account
            </Button>
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-lg sm:text-2xl font-bold break-words text-wrap text-center sm:text-left">Grocery Run #{order.id.slice(0, 6).toUpperCase()}</h1>
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center gap-1 xs:gap-3 text-muted-foreground text-sm sm:text-base text-center sm:text-left">
                <span className="flex items-center justify-center xs:justify-start">
                  <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                  {order.pickup_date ? format(new Date(order.pickup_date), 'PPP') : 'N/A'}
                </span>
                <span className="flex items-center justify-center xs:justify-start">
                  <Clock className="w-4 h-4 ml-2 mr-1 text-muted-foreground" />
                  {order.time_slot}
                </span>
              </div>
            </div>
            <div className="flex flex-row flex-wrap gap-2 sm:gap-4 items-center justify-center sm:justify-end mt-2 sm:mt-0">
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
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Package className="w-5 h-5 mr-2" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                    <span className="break-words">{order.delivery_address}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {order.whatsapp_number || order.phone_number}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t gap-2">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">
                    {order.actual_total ? formatCurrency(order.actual_total) : '(Est.)' + formatCurrency(order.estimated_total)}
                  </span>
                </div>
                {order.actual_total && (
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2">
                    <span className="font-medium">Actual Total:</span>
                    <span className="text-base font-semibold">{formatCurrency(order.actual_total)}</span>
                  </div>
                )}
                {/* Show convenience, service, and delivery fees */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-2">
                  <span className="text-sm text-muted-foreground">Convenience Fee ({order.fees_data?.convenience_fee_percent+'%'}) :</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.convenienceFee || 0)}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">Service Fee ({order.fees_data?.service_fee_percent+'%'}) :</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.serviceFee || 0)}</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">Delivery Fee:</span>
                  <span className="text-sm">{formatCurrency(order.fees_data?.deliveryFee || 0)}</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <span className="text-sm break-words">{order.notes}</span>
                </div>

              </CardContent>
            </Card>

            {/* Store Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Stores Selected
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
                      {/* Only allow editing if not completed/cancelled and at least 1 hour before time slot */}
                      {(() => {
                        // Parse the time slot start time
                        let canEdit = true;
                        if (order.status === 'completed' || order.status === 'cancelled') {
                          canEdit = false;
                        } else if (order.pickup_date && order.time_slot) {
                          // Try to extract start time from time_slot string (e.g. '10:00 AM - 12:00 PM')
                          const slotMatch = (order.time_slot || '').match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
                          if (slotMatch) {
                            const slotTime = slotMatch[1];
                            const pickupDate = new Date(order.pickup_date);
                            // Parse slotTime to 24h
                            let [time, ampm] = slotTime.split(/\s/);
                            let [hour, min] = time.split(':').map(Number);
                            if (ampm && ampm.toUpperCase().startsWith('P') && hour < 12) hour += 12;
                            if (ampm && ampm.toUpperCase().startsWith('A') && hour === 12) hour = 0;
                            pickupDate.setHours(hour, min, 0, 0);
                            const now = new Date();
                            // Only allow editing if now is at least 1 hour before slot
                            if (pickupDate.getTime() - now.getTime() < 60 * 60 * 1000) {
                              canEdit = false;
                            }
                          }
                        }
                        return (
                          <StoreNotes
                            storeId={storeOrder.store_id}
                            notes={storeNotes[storeOrder.store_id] || ''}
                            onNotesChange={(storeId, newNotes) => setStoreNotes(prev => ({ ...prev, [storeId]: newNotes }))}
                            suggestedItems={Array.isArray(storeOrder.stores?.store_suggested_items) ? storeOrder.stores.store_suggested_items : []}
                            maxItems={6}
                            showQtyButtons={true}
                            minimumOrder={30}
                            estimatedTotal={storeOrder.estimated_total}
                            onEstimatedTotalChange={() => {}}
                            // Disable editing if not allowed
                            disabled={!canEdit}
                          />
                        );
                      })()}
                      {/* Save button only if editing is allowed */}
                      {(() => {
                        let canEdit = true;
                        if (order.status === 'completed' || order.status === 'cancelled') {
                          canEdit = false;
                        } else if (order.pickup_date && order.time_slot) {
                          const slotMatch = (order.time_slot || '').match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
                          if (slotMatch) {
                            const slotTime = slotMatch[1];
                            const pickupDate = new Date(order.pickup_date);
                            let [time, ampm] = slotTime.split(/\s/);
                            let [hour, min] = time.split(':').map(Number);
                            if (ampm && ampm.toUpperCase().startsWith('P') && hour < 12) hour += 12;
                            if (ampm && ampm.toUpperCase().startsWith('A') && hour === 12) hour = 0;
                            pickupDate.setHours(hour, min, 0, 0);
                            const now = new Date();
                            if (pickupDate.getTime() - now.getTime() < 60 * 60 * 1000) {
                              canEdit = false;
                            }
                          }
                        }
                        return (canEdit &&
                          <Button
                            size="sm"
                            onClick={() => handleSaveStoreNotes(storeOrder.store_id, storeOrder.id)}
                            disabled={savingNotes[storeOrder.store_id]}
                          >
                            {savingNotes[storeOrder.store_id] ? 'Saving...' : 'Update Notes'}
                          </Button>
                        );
                      })()}
                    </div>

                    {/* Store Photos */}
                    {/* Photo upload hidden for now */}
      {/* Store Photo Viewer Modal */}
      {photoViewer.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={() => setPhotoViewer({ ...photoViewer, open: false })}>
          <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-lg w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={photoViewer.images[photoViewer.index]}
              alt={`Photo ${photoViewer.index + 1}`}
              className="max-h-[60vh] w-auto object-contain rounded mb-4"
            />
            <div className="flex justify-between w-full items-center">
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                onClick={() => setPhotoViewer(v => ({ ...v, index: (v.index - 1 + v.images.length) % v.images.length }))}
                disabled={photoViewer.images.length <= 1}
              >
                Prev
              </button>
              <span className="text-sm text-gray-600">{photoViewer.index + 1} / {photoViewer.images.length}</span>
              <button
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                onClick={() => setPhotoViewer(v => ({ ...v, index: (v.index + 1) % v.images.length }))}
                disabled={photoViewer.images.length <= 1}
              >
                Next
              </button>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setPhotoViewer({ ...photoViewer, open: false })}
              aria-label="Close"
            >
              ×
            </button>
          </div>
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
            {/* Bill Section for delivered orders */}
            {order.status === 'completed' && order.bills && order.bills.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Bills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {order.bills.map((bill, idx) => (
                      <div key={bill.id || idx} className="flex items-center justify-between p-2 border rounded">
                        <span>Bill #{bill.id ? bill.id.slice(0,6).toUpperCase() : idx+1}</span>
                        <Button variant="outline" onClick={() => setSelectedBill(bill)}>
                          View Bill
                        </Button>
                        <Button variant="secondary" onClick={e => {
                          e.preventDefault();
                          if (bill.image) {
                            const link = document.createElement('a');
                            link.href = bill.image;
                            link.download = `bill_${order.id}_${bill.id || ''}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            import('../lib/generateBill').then(({ generateBillPDF }) => {
                              const doc = generateBillPDF({ order, bill, logoUrl });
                              doc.save(`bill_${order.id}_${bill.id || ''}.pdf`);
                            });
                          }
                        }}>
                          Download {bill.image ? 'Image' : 'PDF'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Bill Modal */}
            {selectedBill && (
              <Dialog open={!!selectedBill} onOpenChange={open => { if (!open) setSelectedBill(null); }}>
                <DialogContent>
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
                        <div className="text-xs text-gray-500">ABN 257 558 402 06</div>
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
                  <Button onClick={() => {
                    if (selectedBill.image) {
                      const link = document.createElement('a');
                      link.href = selectedBill.image;
                      link.download = `bill_${order.id}_${selectedBill.id || ''}.jpg`;
                      link.click();
                    } else {
                      import('../lib/generateBill').then(({ generateBillPDF }) => {
                        const doc = generateBillPDF({ order, bill: selectedBill, logoUrl });
                        doc.save(`bill_${order.id}_${selectedBill.id || ''}.pdf`);
                      });
                    }
                  }}>
                    Download {selectedBill.image ? 'Image' : 'PDF'}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <OrderMessaging
              orderId={order.id}
              initialMessages={order.admin_messages || []}
              fetchMessages={async () => {
                const { data } = await supabase.from('pickup_orders').select('admin_messages').eq('id', order.id).single();
                return data?.admin_messages || [];
              }}
              sendMessage={async (msg) => {
                const currentMessages = order.admin_messages || [];
                await supabase.from('pickup_orders').update({
                  admin_messages: [...currentMessages, {
                    from: 'customer',
                    message: msg,
                    timestamp: new Date().toISOString()
                  }]
                }).eq('id', order.id);
              }}
              // disabled={order.status === 'cancelled' || order.status === 'completed'}
              disbled={false}
            />

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