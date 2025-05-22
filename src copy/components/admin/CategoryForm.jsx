
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Image, UploadCloud } from 'lucide-react';
import useSupabaseStorage from '@/hooks/useSupabaseStorage'; // Import the hook

const CategoryForm = ({ category, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', description: '', image_url: '' });
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const { isUploading, uploadFile, deleteFile } = useSupabaseStorage(); // Use the hook

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image_url: category.image_url || '',
      });
      setPreviewUrl(category.image_url || '');
    } else {
      setFormData({ name: '', description: '', image_url: '' });
      setPreviewUrl('');
      setSelectedFile(null);
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    if (selectedFile) {
      if (category && category.image_url) {
        await deleteFile(category.image_url);
      }
      const { url, error } = await uploadFile(selectedFile, 'categories');
      if (error) {
        setErrors(prev => ({ ...prev, image_url: 'Image upload failed.' }));
        return null;
      }
      finalImageUrl = url;
    }
    return finalImageUrl;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;

    const finalImageUrl = await handleImageProcessing();

    if (selectedFile && finalImageUrl === null) {
       toast({ variant: "destructive", title: "Submission Failed", description: "Category could not be saved due to image upload error." });
       return;
    }

    const submissionData = {
      name: formData.name,
      description: formData.description,
      image_url: finalImageUrl,
      updated_at: new Date(),
    };

    if (category?.id) {
      submissionData.id = category.id;
    }

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="space-y-2">
         <Label htmlFor="category-image">Category Image</Label>
         <div className="flex items-center space-x-4">
           <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-muted overflow-hidden">
             {previewUrl ? (
               <img src={previewUrl} alt="Category Preview" className="object-cover w-full h-full" />
             ) : (
               <Image className="w-10 h-10 text-muted-foreground" />
             )}
           </div>
           <Input
             id="category-image" type="file" accept="image/*"
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

      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'border-destructive' : ''} disabled={isUploading} />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className={errors.description ? 'border-destructive' : ''} disabled={isUploading} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>Cancel</Button>
        <Button type="submit" disabled={isUploading}>{isUploading ? 'Saving...' : (category ? 'Save Changes' : 'Add Category')}</Button>
      </DialogFooter>
    </form>
  );
};

export default CategoryForm;
  