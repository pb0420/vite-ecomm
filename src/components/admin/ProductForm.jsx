
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Image, UploadCloud } from 'lucide-react';
import useSupabaseStorage from '@/hooks/useSupabaseStorage';

const ProductForm = ({ product, categories, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '', price: '', unit: '', category_id: '', description: '',
    image_url: '', in_stock: true, featured: false,
  });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const { isUploading, uploadFile, deleteFile } = useSupabaseStorage();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        unit: product.unit || '',
        category_id: product.category_id ? String(product.category_id) : '',
        description: product.description || '',
        image_url: product.image_url || '',
        in_stock: product.in_stock !== undefined ? product.in_stock : true,
        featured: product.featured !== undefined ? product.featured : false,
      });
      setPreviewUrl(product.image_url || '');
    } else {
      setFormData({
        name: '', price: '', unit: '', category_id: '', description: '',
        image_url: '', in_stock: true, featured: false,
      });
      setPreviewUrl('');
      setSelectedFile(null);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleImageProcessing = async () => {
    let finalImageUrl = formData.image_url || null;

    // If a new file is selected, upload it
    if (selectedFile) {
      // Delete the old image first if editing and an old URL exists
      if (product && product.image_url) {
        await deleteFile(product.image_url);
        // We proceed even if deletion fails, maybe log it
      }
      // Upload the new file
      const { url, error } = await uploadFile(selectedFile, 'products');
      if (error) {
        setErrors(prev => ({ ...prev, image_url: 'Image upload failed. Please try again.' }));
        return null; // Indicate failure
      }
      finalImageUrl = url;
    }
    return finalImageUrl;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.unit.trim()) newErrors.unit = 'Unit is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;

    const finalImageUrl = await handleImageProcessing();

    // Check if image processing failed (returned null) when a file was selected
    if (selectedFile && finalImageUrl === null) {
       toast({ variant: "destructive", title: "Submission Failed", description: "Product could not be saved due to image upload error." });
       return; // Stop submission
    }

    const submissionData = {
      name: formData.name,
      price: parseFloat(formData.price),
      unit: formData.unit,
      category_id: parseInt(formData.category_id),
      description: formData.description,
      image_url: finalImageUrl, // Use the processed image URL
      in_stock: formData.in_stock,
      featured: formData.featured,
      updated_at: new Date(),
    };

    if (product?.id) {
      submissionData.id = product.id;
    }

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="space-y-2">
         <Label htmlFor="product-image">Product Image</Label>
         <div className="flex items-center space-x-4">
           <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted overflow-hidden">
             {previewUrl ? (
               <img src={previewUrl} alt="Product Preview" className="object-cover w-full h-full" />
             ) : (
               <Image className="w-10 h-10 text-muted-foreground" />
             )}
           </div>
           <Input
             id="product-image" type="file" accept="image/*"
             onChange={handleFileChange} ref={fileInputRef}
             className="hidden" disabled={isUploading}
           />
           <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <UploadCloud className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : (selectedFile ? 'Change Image' : 'Upload Image')}
           </Button>
         </div>
         {errors.image_url && <p className="text-xs text-destructive">{errors.image_url}</p>}
       </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'border-destructive' : ''} disabled={isUploading} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className={errors.price ? 'border-destructive' : ''} disabled={isUploading} />
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit (e.g., lb, bunch, each)</Label>
          <Input id="unit" name="unit" value={formData.unit} onChange={handleChange} className={errors.unit ? 'border-destructive' : ''} disabled={isUploading} />
          {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select value={formData.category_id} onValueChange={(value) => handleSelectChange('category_id', value)} disabled={isUploading}>
            <SelectTrigger className={errors.category_id ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className={errors.description ? 'border-destructive' : ''} disabled={isUploading} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="in_stock" name="in_stock" checked={formData.in_stock} onCheckedChange={(checked) => handleSelectChange('in_stock', checked)} disabled={isUploading} />
          <Label htmlFor="in_stock">In Stock</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="featured" name="featured" checked={formData.featured} onCheckedChange={(checked) => handleSelectChange('featured', checked)} disabled={isUploading} />
          <Label htmlFor="featured">Featured Product</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>Cancel</Button>
        <Button type="submit" disabled={isUploading}>{isUploading ? 'Saving...' : (product ? 'Save Changes' : 'Add Product')}</Button>
      </DialogFooter>
    </form>
  );
};

export default ProductForm;
  