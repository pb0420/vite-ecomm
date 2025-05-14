
import React from 'react';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Users } from 'lucide-react';

const AdminSummaryCards = ({ pendingCount, processingCount, deliveredCount }) => {
  const cardData = [
    { title: 'Pending Orders', count: pendingCount, icon: Package, color: 'yellow' },
    { title: 'Processing Orders', count: processingCount, icon: ShoppingBag, color: 'blue' },
    { title: 'Delivered Orders', count: deliveredCount, icon: Users, color: 'green' },
  ];

  const colors = {
    yellow: { bg: 'bg-yellow-100/50', text: 'text-yellow-600' },
    blue: { bg: 'bg-blue-100/50', text: 'text-blue-600' },
    green: { bg: 'bg-green-100/50', text: 'text-green-600' },
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cardData.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
          className="p-6 border rounded-lg bg-card"
        >
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${colors[card.color].bg}`}>
              <card.icon className={`h-6 w-6 ${colors[card.color].text}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold">{card.count}</h3>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AdminSummaryCards;
  