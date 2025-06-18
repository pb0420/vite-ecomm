import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Store, Package, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const UpcomingOrders = ({ orders }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

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
    <div className="space-y-2">
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
                  Order #{order.id.slice(0, 6).toUpperCase()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Link to={`/pickup-order/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
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
                <div className="flex flex-wrap gap-1">
                  {order.pickup_order_stores?.map((storeOrder, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {storeOrder.stores?.name}
                    </Badge>
                  ))}
                </div>
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
                  <div>
                    <h4 className="text-sm font-medium mb-2">Store Details:</h4>
                    <div className="space-y-2">
                      {order.pickup_order_stores?.map((storeOrder, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                          <span>{storeOrder.stores?.name}</span>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(storeOrder.estimated_total || 0)}</div>
                            <Badge variant="outline" className="text-xs">
                              {storeOrder.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.photos && order.photos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Photos:</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {order.photos.slice(0, 4).map((photo, index) => (
                          <img
                            key={index}
                            src={photo.data}
                            alt={`Photo ${index + 1}`}
                            className="aspect-square rounded object-cover cursor-pointer"
                            onClick={() => window.open(photo.data, '_blank')}
                          />
                        ))}
                        {order.photos.length > 4 && (
                          <div className="aspect-square rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            +{order.photos.length - 4} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <Link to={`/pickup-order/${order.id}`}>
                      <Button size="sm">
                        View Full Details
                      </Button>
                    </Link>
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