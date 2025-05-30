import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPage = () => {
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Last updated: May 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and contact information</li>
              <li>Delivery address</li>
              <li>Order history and preferences</li>
              <li>Payment information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Process and deliver your orders</li>
              <li>Send order confirmations and updates</li>
              <li>Improve our services</li>
              <li>Communicate with you about promotions and updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="mb-4">
              We do not sell your personal information. We share your information only with:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Delivery partners to fulfill your orders</li>
              <li>Payment processors to handle transactions</li>
              <li>Service providers who assist our operations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Your Rights</h2>
            <p className="mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPage;