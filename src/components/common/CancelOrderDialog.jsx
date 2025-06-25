import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const CANCEL_REASONS = [
  "Changed my mind",
  "Found a better price",
  "Ordered by mistake",
  "Need to change address/time",
  "Other"
];

const CancelOrderDialog = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason) return;
    onConfirm(finalReason);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Cancel Order</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Cancelling your order may incur a cancellation fee. Please select a reason:
        </p>
        <div className="space-y-2 mb-4">
          {CANCEL_REASONS.map(opt => (
            <label key={opt} className="flex items-center gap-2">
              <input
                type="radio"
                name="cancel-reason"
                value={opt}
                checked={reason === opt}
                onChange={() => setReason(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
          {reason === 'Other' && (
            <input
              type="text"
              className="w-full border rounded px-2 py-1 mt-1"
              placeholder="Enter reason"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Close</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || (!reason || (reason === 'Other' && !customReason))}
          >
            {loading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderDialog;