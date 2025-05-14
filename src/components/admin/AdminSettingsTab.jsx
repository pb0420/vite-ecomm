
import React from 'react';
import { motion } from 'framer-motion';
import DeliverySettingsForm from '@/components/admin/DeliverySettingsForm';
import StripeSettingsForm from '@/components/admin/StripeSettingsForm'; // New import
import { Separator } from '@/components/ui/separator';

const AdminSettingsTab = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-xl font-semibold">Delivery Settings</h2>
        <div className="p-6 mt-4 border rounded-lg">
          <DeliverySettingsForm />
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-xl font-semibold">Stripe Payment Gateway</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your Stripe account to enable online payments.
        </p>
        <div className="p-6 mt-4 border rounded-lg">
          <StripeSettingsForm />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettingsTab;
  