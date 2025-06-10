import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Store, MessageCircle, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const UpcomingOrders = ({ orders, onSendMessage }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = (orderId) => {
    if (!newMessage.trim()) return;
    
    onSendMessage(orderId, newMessage);
    setNewMessage('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No upcoming orders</h3>
          <p className="text-sm text-muted-foreground text-center">
            Your scheduled pickup orders will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Upcoming Orders</h3>
      {orders.map((order) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Order #{order.id.slice(0, 8)}...
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    {expandedOrder === order.id ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                    }
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  {formatDate(order.pickup_date)}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  {order.time_slot}
                </div>
              </div>

              <div className="flex items-center text-sm">
                <Store className="w-4 h-4 mr-2 text-muted-foreground" />
                {order.stores?.name || 'Store information unavailable'}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span>Estimated Total:</span>
                <span className="font-medium">{formatCurrency(order.estimated_total)}</span>
              </div>

              {expandedOrder === order.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t"
                >
                  {order.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Your Notes:</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {order.notes}
                      </p>
                    </div>
                  )}

                  {order.photos && order.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Photos:</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {order.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo.data}
                            alt={`Photo ${index + 1}`}
                            className="aspect-square rounded object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {order.admin_messages && order.admin_messages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Messages:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {order.admin_messages.map((message, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded text-sm ${
                              message.from === 'admin' 
                                ? 'bg-blue-50 border-l-4 border-blue-400' 
                                : 'bg-gray-50 border-l-4 border-gray-400'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">
                                {message.from === 'admin' ? 'Admin' : 'You'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), 'MMM d, HH:mm')}
                              </span>
                            </div>
                            <p>{message.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Send a message:</h4>
                    <div className="flex space-x-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSendMessage(order.id)}
                        disabled={!newMessage.trim()}
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default UpcomingOrders;