import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';

const LoginDialog = ({ open, onOpenChange }) => {
  return (
    <Dialog style={{maxHeight:'90vh'}} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hi there!</DialogTitle>
        </DialogHeader>
        <PhoneLoginForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;