import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsPage = () => {
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-muted-foreground mb-6">
            Last updated: May 24, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Groceroo's services, you agree to be bound by these Terms and Conditions.
              These terms govern your use of our website, mobile application, and delivery services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-4">
              Groceroo provides an online grocery shopping and delivery service. We:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Accept orders for grocery items</li>
              <li>Process payments securely</li>
              <li>Deliver orders to specified addresses</li>
              <li>Offer store pickup services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Ordering and Delivery</h2>
            <p className="mb-4">
              When placing an order:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You must provide accurate delivery information</li>
              <li>Orders are subject to product availability</li>
              <li>Delivery times are estimates and not guaranteed</li>
              <li>Minimum order values may apply</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Pricing and Payment</h2>
            <p className="mb-4">
              All prices are in AUD and include applicable taxes. Additional fees may apply:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Delivery fees</li>
              <li>Service fees</li>
              <li>Special handling fees</li>
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

export default TermsPage;