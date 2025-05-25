
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const CustomerLoginFormCard = () => {
  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold">Welcome to Groceroo</h1>
        <p className="mt-2 text-muted-foreground">
          Groceries made easy!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 border rounded-lg shadow-lg bg-card"
      >
        <LoginForm />

        <div className="mt-6 text-sm text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLoginFormCard;
  