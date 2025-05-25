
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';


// const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from loading to avoid conflict
  const { login, loading: authLoading } = useAuth();
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting || authLoading) return;

    setIsSubmitting(true);
    const { success, isAdminUser } = await login(formData.email, formData.password);
    
    if (success) {
      if (isAdminUser) {
        navigate('/admin');
      } else {
        navigate('/'); // Navigate to homepage for regular users
      }
    } else {
      // Error toast is handled by AuthContext's login function
      // If login was successful but not admin, and they tried to access admin,
      // the AdminPage's own protection logic will handle redirection/toast.
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isSubmitting || authLoading}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'border-destructive' : ''}
          disabled={isSubmitting || authLoading}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="text-sm text-right">
        <Link to="/forgot-password" className={`text-primary hover:underline ${(isSubmitting || authLoading) ? 'pointer-events-none opacity-50' : ''}`}>
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
        {(isSubmitting || authLoading) ? (
          <>
            <div className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  );
};

const LoginForm = () => {
   <PhoneLoginForm onSuccess={() => onOpenChange(false)} />
}

export default LoginForm;
  