import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const PhoneLoginForm = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a phone number" });
      return;
    }

    // Ensure phone number starts with +61
    const formattedNumber = phoneNumber.startsWith('+61') ? phoneNumber : `+61${phoneNumber.replace(/^0/, '')}`;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedNumber,
      });

      if (error) throw error;

      setCodeSent(true);
      setCountdown(30);
      toast({ title: "Code Sent", description: "Please check your phone for the verification code." });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid 6-digit code" });
      return;
    }

    setLoading(true);
    try {
      const formattedNumber = phoneNumber.startsWith('+61') ? phoneNumber : `+61${phoneNumber.replace(/^0/, '')}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedNumber,
        token: otp,
        type: 'sms'
      });

      if (error) throw error;

      toast({ title: "Success", description: "You have been successfully logged in." });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Sign in to continue</h3>
        <p className="text-sm text-muted-foreground">
          Please verify your phone number
        </p>
      </div>
      
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex space-x-2">
            <Input
              id="phone"
              type="tel"
              placeholder="04XXXXXXXX"
              value={phoneNumber.replace(/^\+61/, '')}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSendOtp}
              disabled={loading || (countdown > 0)}
            >
              {countdown > 0 ? `Resend (${countdown}s)` : codeSent ? 'Resend Code' : 'Send Code'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={loading}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || !codeSent || otp.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms and Conditions</Link> and{' '}
          <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
        </p>
      </form>
    </div>
  );
};

export default PhoneLoginForm;