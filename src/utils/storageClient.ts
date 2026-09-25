/**
 * Supabase Storage Client Utilities for GreatStarGem
 * 
 * Uploads media (videos and images) directly to the Supabase Storage bucket
 * via the server-side proxy route `/api/storage/upload`.
 * Returns the public CDN URL which is then saved as a string field in PostgreSQL
 * via Prisma (e.g. Project.videoUrl, Project.image, Testimonial.avatar).
 */

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

/**
 * Uploads a local file to the Supabase Storage bucket.
 * 1. Encodes file as Data URL
 * 2. Transmits to `/api/storage/upload`
 * 3. Server uploads buffer into target Supabase Storage public bucket
 * 4. Returns the public CDN URL to store in Postgres via Prisma
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  folder: 'videos' | 'projects' | 'testimonials' | 'media' = 'media',
  onProgress?: (message: string) => void
): Promise<UploadResult> {
  const validation = validateFileSize(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || `File size exceeds the ${MAX_MEDIA_SIZE_MB}MB limit.`,
    };
  }

  onProgress?.(`Reading ${file.name} (${validation.sizeMb} MB)...`);

  let dataUrl: string;
  try {
    dataUrl = await fileToDataUrl(file);
  } catch (err) {
    return {
      success: false,
      error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  onProgress?.(`Uploading to Supabase Storage bucket [${folder}]...`);

  try {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl,
        fileName: file.name,
        folder,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success && data.url) {
      onProgress?.('✓ Uploaded successfully to Supabase Storage CDN.');
      return {
        success: true,
        url: data.url,
        path: data.path,
        bucket: data.bucket,
        storageType: 'supabase',
      };
    }

    // Backend returned an error or requires API key
    return {
      success: false,
      error: data.error || 'Failed to upload to Supabase Storage bucket.',
      requiresKey: Boolean(data.requiresKey),
    };
  } catch (err) {
    return {
      success: false,
      error: `Upload network failure: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
