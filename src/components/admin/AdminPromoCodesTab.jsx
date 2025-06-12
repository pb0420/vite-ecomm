import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, PlusCircle, Edit, Trash2, Tag, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import PromoCodeForm from '@/components/admin/PromoCodeForm';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const AdminPromoCodesTab = ({ openDeleteDialog }) => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load promo codes." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const filteredPromoCodes = promoCodes.filter(promo =>
    promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePromoSubmit = async (promoData) => {
    setLoading(true);
    try {
      let result;
      if (editingPromo) {
        const { data, error } = await supabase
          .from('promo_codes')
          .update({
            ...promoData,
            updated_at: new Date()
          })
          .eq('id', editingPromo.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Promo Code Updated", description: `${result.code} has been updated.` });
      } else {
        const { data, error } = await supabase
          .from('promo_codes')
          .insert(promoData)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Promo Code Created", description: `${result.code} has been created.` });
      }

      fetchPromoCodes();
      setIsDialogOpen(false);
      setEditingPromo(null);
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (promoId) => {
    const promoToDelete = promoCodes.find(p => p.id === promoId);
    if (promoToDelete) {
      openDeleteDialog('promo_code', promoId);
    }
  };

  const getStatusBadge = (promo) => {
    const now = new Date();
    const validFrom = new Date(promo.valid_from);
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

    if (!promo.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (now < validFrom) {
      return <Badge variant="secondary">Scheduled</Badge>;
    }

    if (validUntil && now > validUntil) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (promo.max_uses && promo.current_uses >= promo.max_uses) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const formatDiscount = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}%`;
    }
    return formatCurrency(promo.discount_value);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Promo Codes Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search promo codes..." 
              className="pl-8 w-full md:w-[200px]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) setEditingPromo(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPromo(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingPromo ? 'Edit Promo Code' : 'Add New Promo Code'}</DialogTitle>
              </DialogHeader>
              <PromoCodeForm
                key={editingPromo ? editingPromo.id : 'new'}
                promoCode={editingPromo}
                onSubmit={handlePromoSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromoCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">No promo codes found.</TableCell>
                </TableRow>
              ) : (
                filteredPromoCodes.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-mono font-medium">{promo.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{promo.description}</TableCell>
                    <TableCell>
                      <span className="font-medium">{formatDiscount(promo)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {promo.discount_type === 'percentage' ? 'off' : 'discount'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {promo.minimum_order_amount > 0 ? formatCurrency(promo.minimum_order_amount) : 'None'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {promo.current_uses || 0}
                          {promo.max_uses ? ` / ${promo.max_uses}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {promo.valid_until ? format(new Date(promo.valid_until), 'MMM d, yyyy') : 'No expiry'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(promo)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { 
                          setEditingPromo(promo); 
                          setIsDialogOpen(true); 
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => triggerDelete(promo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default AdminPromoCodesTab;