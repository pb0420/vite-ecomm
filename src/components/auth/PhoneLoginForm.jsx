import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, Shield, CheckCircle } from 'lucide-react';
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
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 shadow-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome </h3>
          <p className="text-gray-600 text-sm">
            Please verify your phone number to continue.
          </p>
        </div>
        
        <form onSubmit={codeSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Phone Number
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm font-medium">+61</span>
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="04XXXXXXXX"
                value={phoneNumber.replace(/^\+61/, '')}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading || codeSent}
                className="pl-10 h-10 text-base border-2 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* OTP Input - Only show after code is sent */}
          {codeSent && (
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">
                Verification Code
              </Label>
              <div className="relative">
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={loading}
                  className="h-10 text-base text-center tracking-widest border-2 focus:border-primary transition-colors"
                />
                {otp.length === 6 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!codeSent ? (
              <Button 
                type="submit" 
                className="w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending Code...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Verification Code
                  </div>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full h-10 text-base font-semibold bg-primary hover:bg-primary/90 transition-colors"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Verifying...
                    </div>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-8 text-sm"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline font-medium" target="_blank">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneLoginForm;