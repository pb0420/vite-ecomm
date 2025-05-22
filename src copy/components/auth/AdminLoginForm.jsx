
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const AdminLoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loading: authLoading, logout } = useAuth(); // Added logout
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting || authLoading) return;

    setIsSubmitting(true);
    const { success, isAdminUser, error } = await login(formData.email, formData.password);
    
    if (success) {
      if (isAdminUser) {
        navigate('/admin');
        toast({ title: "Admin Access Granted", description: "Welcome to the Admin Dashboard." });
      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have admin privileges. Logging out." });
        await logout(); // Sign out non-admin users trying to access admin portal
      }
    } else {
      // Error toast is handled by AuthContext's login function if error object is not returned
      // If login function returns an error message, display it
      if (error && error !== "Invalid login credentials") { // Avoid double toast for "Invalid login credentials"
         toast({ variant: "destructive", title: "Login Failed", description: error });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="admin-email">Admin Email</Label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="admin_master@groceroo.com.au"
          className={`${errors.email ? 'border-destructive' : ''} focus:border-destructive/80`}
          disabled={isSubmitting || authLoading}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Admin Password</Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className={`${errors.password ? 'border-destructive' : ''} focus:border-destructive/80`}
          disabled={isSubmitting || authLoading}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>
      
      <div className="text-sm text-right">
        <Link to="/forgot-password" className={`text-muted-foreground hover:text-destructive ${(isSubmitting || authLoading) ? 'pointer-events-none opacity-50' : ''}`}>
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting || authLoading}>
        {(isSubmitting || authLoading) ? (
          <>
            <div className="mr-2 h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"></div>
            Authenticating...
          </>
        ) : (
          'Sign In to Admin Portal'
        )}
      </Button>
    </form>
  );
};

export default AdminLoginForm;
  