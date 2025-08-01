import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowLeft, Truck, Clock, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import CancelOrderDialog from '@/components/common/CancelOrderDialog';
import OrderMessaging from '@/components/common/OrderMessaging';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Bill modal state
  const [selectedBill, setSelectedBill] = useState(null);
  const logoUrl = '/logo.webp';

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          setOrder(orderData);

          // Fetch delivery settings for express delivery time
          if (orderData.expected_delivery_at === null) {
             let currentTime = new Date().getTime();
             let updatedTIme = new Date(currentTime + 45 * 60 * 1000); // 45 mins
            setDeliveryTime(updatedTIme);
          } else  {
            setDeliveryTime(new Date(orderData.expected_delivery_at));
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);
  
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

  const getStatusInfo = () => {
    if (!order) return null;

    const statusConfig = {
      pending: {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        title: 'Order Pending',
        description: deliveryTime ? `Estimated delivery by ${formatDate(deliveryTime)}` : 'Processing your order'
      },
      processing: {
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        icon: Package,
        title: 'Order Processing',
        description: 'Your order is being processed. ' + (deliveryTime ? `Estimated delivery by ${formatDate(deliveryTime)}`:'')
      },
      out_for_delivery: {
        color: 'text-orange-500',
        bgColor: 'bg-orange-100',
        icon: Truck,
        title: 'Out for Delivery',
        description: 'Your order is out for delivery.'
      },
      delivered: {
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        title: 'Order Delivered',
        description: 'Your order has been delivered'
      },
      cancelled: {
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        icon: XCircle,
        title: 'Order Cancelled',
        description: 'This order has been cancelled'
      }
    };

    return statusConfig[order.status] || statusConfig.pending;
  };
  
  const canCancel = order && ['pending', 'processing'].includes(order.status);

  const handleCancelOrder = async (reason) => {
    setCancelling(true);
    setCancelError(null);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', cancel_reason: reason })
        .eq('id', order.id);
      if (error) throw error;
      setOrder({ ...order, status: 'cancelled', cancel_reason: reason });
      setShowCancelDialog(false);
    } catch (err) {
      setCancelError('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
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
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The order you're looking for doesn't exist.
          </p>
          <Link to="/shop">
            <Button className="mt-4">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <div>
          <Link to="/account">
            <Button variant="ghost" className="mb-4 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Account
            </Button>
          </Link>
        </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >

        

        {/* Order Status Section */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`mx-auto w-24 h-24 rounded-full ${statusInfo.bgColor} flex items-center justify-center mb-4`}
          >
            <StatusIcon className={`w-12 h-12 ${statusInfo.color}`} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
          <p className="text-muted-foreground">{statusInfo.description}</p>
        </div>

        {/* Order Progress Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-muted transform -translate-y-1/2">
              <div 
                className={`h-full bg-primary transition-all duration-500 ${
                  order.status === 'pending' ? 'w-1/4' :
                  order.status === 'processing' ? 'w-2/4' :
                  order.status === 'out_for_delivery' ? 'w-3/4' :
                  order.status === 'delivered' ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['pending', 'processing', 'out_for_delivery', 'delivered'].includes(order.status) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Confirmed</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['processing', 'out_for_delivery', 'delivered'].includes(order.status) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Processing</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['out_for_delivery', 'delivered'].includes(order.status) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Out for Delivery</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Delivered</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 border rounded-lg text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Order #{order.id.slice(0, 6).toUpperCase()}</h2>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(order.created_at)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{order.customer_address}</p>
            </div>
            
            {order.delivery_notes && (
              <div>
                <p className="text-sm text-muted-foreground">Delivery Notes</p>
                <p className="font-medium">{order.delivery_notes}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Order Items</h3>
            
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {/* show service fee and delivery fee from fees_data */}
              {order.fees_data && order.fees_data.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>{formatCurrency(order.fees_data.delivery_fee)}</span>
                </div>
              )}
              {order.fees_data && order.fees_data.service_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee ({order.fees_data.serviceFeePercent}%)</span>
                  <span>{formatCurrency(order.fees_data.service_fee)}</span>
                </div> 
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/shop">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/account/orders">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </Link>
        </div>
        {canCancel && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="destructive"
              className="w-full max-w-xs"
              onClick={() => setShowCancelDialog(true)}
              disabled={cancelling}
            >
              Cancel Order
            </Button>
            <CancelOrderDialog
              open={showCancelDialog}
              onClose={() => setShowCancelDialog(false)}
              onConfirm={handleCancelOrder}
              loading={cancelling}
            />
          </div>
        )}
        {cancelError && (
          <div className="mt-4 text-red-500 text-center">{cancelError}</div>
        )}

        {/* Payment Details if paid */}
        {order.payment_status === 'paid' && order.payment_data && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
            <div className="font-medium mb-1 text-green-800">Payment Details:</div>
            <pre className="text-xs text-green-900 whitespace-pre-wrap break-all">{JSON.stringify(order.payment_data, null, 2)}</pre>
          </div>
        )}
        {/* Bill Section for delivered orders */}
        {order.status === 'delivered' && order.bills && order.bills.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Bills</h3>
            <div className="space-y-2">
              {order.bills.map((bill, idx) => (
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

        {/* Order Messaging Component */}
        <OrderMessaging
          orderId={order.id}
          initialMessages={order.admin_messages || []}
          fetchMessages={async () => {
            const { data } = await supabase.from('orders').select('admin_messages').eq('id', order.id).single();
            return data?.admin_messages || [];
          }}
          sendMessage={async (msg) => {
            const currentMessages = order.admin_messages || [];
            await supabase.from('orders').update({
              admin_messages: [...currentMessages, {
                from: 'customer',
                message: msg,
                timestamp: new Date().toISOString()
              }]
            }).eq('id', order.id);
          }}
          disabled={order.status === 'cancelled' || order.status === 'delivered'}
        />
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;