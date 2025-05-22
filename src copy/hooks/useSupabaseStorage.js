
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const useSupabaseStorage = (bucketName = 'groceroo_images') => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadFile = async (file, folderPath = '') => {
    if (!file) return { url: null, error: null };

    setIsUploading(true);
    setUploadError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      setIsUploading(false);
      return { url: urlData.publicUrl, error: null };

    } catch (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      setUploadError(error.message);
      toast({ variant: "destructive", title: "Upload Failed", description: error.message });
      setIsUploading(false);
      return { url: null, error: error.message };
    }
  };

  const deleteFile = async (fileUrl) => {
     if (!fileUrl) return { success: true, error: null }; // Nothing to delete

     // Extract the file path from the full URL
     const urlParts = fileUrl.split('/');
     const bucketIndex = urlParts.findIndex(part => part === bucketName);
     if (bucketIndex === -1 || bucketIndex === urlParts.length - 1) {
       console.warn("Could not parse file path from URL:", fileUrl);
       return { success: false, error: "Could not parse file path" };
     }
     const filePath = urlParts.slice(bucketIndex + 1).join('/');

     if (!filePath) {
         console.warn("Empty file path extracted from URL:", fileUrl);
         return { success: false, error: "Empty file path" };
     }

     try {
         const { error } = await supabase.storage
             .from(bucketName)
             .remove([filePath]);

         if (error) {
             throw error;
         }
         console.log(`Successfully deleted file ${filePath} from ${bucketName}.`);
         return { success: true, error: null };
     } catch (error) {
         console.error(`Error deleting file ${filePath}:`, error);
         toast({ variant: "destructive", title: "Deletion Error", description: `Could not delete file: ${error.message}` });
         return { success: false, error: error.message };
     }
  };

  return { isUploading, uploadError, uploadFile, deleteFile };
};

export default useSupabaseStorage;
  