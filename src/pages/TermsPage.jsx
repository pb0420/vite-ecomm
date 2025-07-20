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
              By accessing and using this website and it's services (groceroo.com.au), you agree to be bound by these Terms and Conditions.
              These terms govern your use of the website, mobile application, and delivery services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="mb-4">
              This website (groceroo.com.au) provides an online grocery shopping and delivery service. We:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Accept orders for grocery items</li>
              <li>Process payments securely</li>
              <li>Deliver orders to specified addresses</li>
              <li>Offer grocery delivery services from stores</li>
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
              <li>Product images may not be completely accurate.</li>
              <li>Additional charges may apply</li>
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

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Returns and Refunds</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Returns are accepted only for items that are damaged, defective, or incorrect at the time of delivery.</li>
              <li>To request a return or refund, you must contact us within 24 hours of receiving your order.</li>
              <li>Proof of purchase and photographic evidence of the issue may be required.</li>
              <li>Perishable goods (such as fresh produce, dairy, and frozen items) are not eligible for return unless they are damaged or spoiled upon delivery.</li>
              <li>Refunds will be processed to your original payment method within 5–7 business days after approval.</li>
              <li>Delivery fees are non-refundable except in cases where the entire order is returned due to our error.</li>
              <li>We reserve the right to refuse returns or refunds if the claim does not seem justified.</li>
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