import { createClient } from '@supabase/supabase-js';

//Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const MAX_MEDIA_SIZE_MB = 50;
export const MAX_MEDIA_SIZE_BYTES = 50 * 1024 * 1024;

export interface FileSizeValidation {
  valid: boolean;
  sizeMb: string;
  maxSizeMb: number;
  error?: string;
}

export function validateFileSize(file: File, maxSizeMb: number = MAX_MEDIA_SIZE_MB): FileSizeValidation {
  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    const isVideo = file.type.startsWith('video/');
    return {
      valid: false,
      sizeMb,
      maxSizeMb,
      error: `The selected ${isVideo ? 'video' : 'file'} "${file.name}" is ${sizeMb} MB, which exceeds the maximum allowed limit of ${maxSizeMb} MB. Please select a file under ${maxSizeMb} MB or compress the file before uploading.`,
    };
  }
  return { valid: true, sizeMb, maxSizeMb };
}

export interface StorageStatus {
  configured: boolean;
  url: string | null;
  projectRef: string | null;
  bucket: string;
  hasKey: boolean;
  source: 'env' | 'cache' | 'inferred' | 'none';
  bucketExists: boolean;
  bucketMessage?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  bucket?: string;
  storageType?: 'supabase' | 'local_fallback';
  error?: string;
  requiresKey?: boolean;
}

/**
 * Fetches the active Supabase Storage status from backend.
 */
export async function fetchStorageStatus(): Promise<StorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch storage status:', err);
  }
  return {
    configured: false,
    url: null,
    projectRef: null,
    bucket: 'media',
    hasKey: false,
    source: 'none',
    bucketExists: false,
  };
}

/**
 * Updates or sets the Supabase Storage configuration (API key, bucket, or custom URL).
 */
export async function updateStorageConfig(config: {
  url?: string;
  key?: string;
  bucket?: string;
}): Promise<{ success: boolean; message: string; bucketExists?: boolean }> {
  try {
    const res = await fetch('/api/storage/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error updating storage config',
    };
  }
}

/**
 * Converts a browser File object to a Base64 Data URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}


export async function uploadFileToSupabaseStorage(
  file: File,
  folder: 'Avatar_image' | 'Cover_image' | 'Videos' | 'media' = 'media',
  onProgress?: (message: string) => void
): Promise<UploadResult> {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, requiresKey: true, error: 'Missing Supabase API keys.' };
    }

    if (onProgress) onProgress(`Preparing ${file.name}...`);
  const validation = validateFileSize(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || `File size exceeds the ${MAX_MEDIA_SIZE_MB}MB limit.`,
    };
  }


  onProgress?.(`Reading ${file.name} (${validation.sizeMb} MB)...`);

  // Clean filename to prevent path collision and characters issue
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  onProgress?.(`Uploading ${file.name} to '${folder}' bucket....`)

  // Upload file to Supabase bucket
  const { data, error } = await supabase.storage
    .from(folder)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Supabase Storage Error:', error);
      return{ success: false, error: error.message };
    }

    // Retrieve public CDN URL for uploaded asset
    const { data: publicUrlData } = supabase.storage
      .from(folder)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (err: any) {
    console.error('Upload Error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected upload error occurred.',
    };
  }
};