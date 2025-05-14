
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdminLoginForm from '@/components/auth/AdminLoginForm'; // Using a dedicated AdminLoginForm
import { ShieldAlert } from 'lucide-react';

const AdminLoginPage = () => {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8 mx-auto md:px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center mb-8 text-center"
        >
          <ShieldAlert className="w-12 h-12 mb-4 text-destructive" />
          <h1 className="text-3xl font-bold text-destructive">Admin Portal</h1>
          <p className="mt-2 text-muted-foreground">
            Authorized personnel access only.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-6 border-2 border-destructive/30 rounded-lg shadow-xl bg-card"
        >
          <AdminLoginForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center text-sm"
        >
          <p className="text-muted-foreground">
            Not an admin? Return to{' '}
            <Link to="/" className="text-primary hover:underline">
              Homepage
            </Link>
            {' '}or{' '}
            <Link to="/login" className="text-primary hover:underline">
              Customer Login
            </Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
  