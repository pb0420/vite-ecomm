import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const PhoneLoginForm = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

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

      setShowOtpInput(true);
      toast({ title: "OTP Sent", description: "Please check your phone for the verification code." });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter the verification code" });
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
      
      {!showOtpInput ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex space-x-2">
              <Select value="+61" disabled>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+61">+61 AU</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                placeholder="412 345 678"
                value={phoneNumber.replace(/^\+61/, '')}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="flex-1"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setShowOtpInput(false)}
            disabled={loading}
          >
            Use different phone number
          </Button>
        </form>
      )}
    </div>
  );
};

export default PhoneLoginForm;