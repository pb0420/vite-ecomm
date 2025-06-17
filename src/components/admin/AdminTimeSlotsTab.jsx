import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, PlusCircle, Edit, Trash2, Clock, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimeSlotForm from '@/components/admin/TimeSlotForm';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const AdminTimeSlotsTab = ({ openDeleteDialog }) => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const fetchTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('time_slots')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (typeFilter !== 'all') {
        query = query.eq('slot_type', typeFilter);
      }

      if (dateFilter === 'today') {
        query = query.eq('date', new Date().toISOString().split('T')[0]);
      } else if (dateFilter === 'upcoming') {
        query = query.gte('date', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load time slots." });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFilter]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const filteredTimeSlots = timeSlots.filter(slot => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      slot.slot_type.toLowerCase().includes(searchLower) ||
      format(new Date(slot.date), 'PPP').toLowerCase().includes(searchLower) ||
      formatTime(slot.start_time).toLowerCase().includes(searchLower) ||
      formatTime(slot.end_time).toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSlotSubmit = async (slotData) => {
    setLoading(true);
    try {
      let result;
      if (editingSlot) {
        const { data, error } = await supabase
          .from('time_slots')
          .update({
            ...slotData,
            updated_at: new Date()
          })
          .eq('id', editingSlot.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Time Slot Updated", description: "Time slot has been updated successfully." });
      } else {
        const { data, error } = await supabase
          .from('time_slots')
          .insert(slotData)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Time Slot Created", description: "Time slot has been created successfully." });
      }

      fetchTimeSlots();
      setIsDialogOpen(false);
      setEditingSlot(null);
    } catch (error) {
      console.error('Error saving time slot:', error);
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (slotId) => {
    const slotToDelete = timeSlots.find(s => s.id === slotId);
    if (slotToDelete) {
      openDeleteDialog('time_slot', slotId);
    }
  };

  const getStatusBadge = (slot) => {
    const now = new Date();
    const slotDate = new Date(slot.date);
    const isToday = slotDate.toDateString() === now.toDateString();
    const isPast = slotDate < now && !isToday;
    const isFull = slot.current_orders >= slot.max_orders;

    if (isPast) {
      return <Badge variant="secondary">Past</Badge>;
    }
    if (!slot.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (isFull) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (isToday) {
      return <Badge variant="default">Today</Badge>;
    }
    return <Badge variant="outline">Available</Badge>;
  };

  const getAvailabilityColor = (slot) => {
    const percentage = (slot.current_orders / slot.max_orders) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Time Slots Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search slots..." 
              className="pl-8 w-full md:w-[200px]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) setEditingSlot(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingSlot(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}</DialogTitle>
              </DialogHeader>
              <TimeSlotForm
                key={editingSlot ? editingSlot.id : 'new'}
                timeSlot={editingSlot}
                onSubmit={handleSlotSubmit}
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
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimeSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">No time slots found.</TableCell>
                </TableRow>
              ) : (
                filteredTimeSlots.map(slot => (
                  <TableRow key={slot.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(slot.date), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={slot.slot_type === 'delivery' ? 'default' : 'secondary'}>
                        {slot.slot_type.charAt(0).toUpperCase() + slot.slot_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{slot.max_orders} orders</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getAvailabilityColor(slot)}>
                        {slot.current_orders} / {slot.max_orders}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(slot)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { 
                          setEditingSlot(slot); 
                          setIsDialogOpen(true); 
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => triggerDelete(slot.id)}
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

export default AdminTimeSlotsTab;