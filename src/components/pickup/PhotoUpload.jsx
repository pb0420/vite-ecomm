import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

const PhotoUpload = ({ photos, onPhotosChange, maxPhotos = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > maxPhotos) {
      toast({
        variant: "destructive",
        title: "Too many photos",
        description: `You can only upload up to ${maxPhotos} photos.`
      });
      return;
    }

    setUploading(true);

    try {
      const compressedPhotos = await Promise.all(
        files.map(async (file) => {
          const compressedFile = await compressImage(file);
          const reader = new FileReader();
          
          return new Promise((resolve) => {
            reader.onload = () => {
              resolve({
                id: Date.now() + Math.random(),
                name: file.name,
                data: reader.result,
                size: compressedFile.size
              });
            };
            reader.readAsDataURL(compressedFile);
          });
        })
      );

      onPhotosChange([...photos, ...compressedPhotos]);
      toast({
        title: "Photos uploaded",
        description: `${compressedPhotos.length} photo(s) added successfully.`
      });
    } catch (error) {
      console.error('Error compressing photos:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to process photos. Please try again."
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (photoId) => {
    onPhotosChange(photos.filter(photo => photo.id !== photoId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Photos (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Upload photos of your shopping list or special items. Max {maxPhotos} photos.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= maxPhotos}
          className="flex items-center"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Processing...' : 'Upload Photos'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                <img
                  src={photo.data}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(photo.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="mt-1 text-xs text-muted-foreground truncate">
                {photo.name} ({formatFileSize(photo.size)})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;