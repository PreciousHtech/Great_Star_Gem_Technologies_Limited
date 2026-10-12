import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const STORAGE_CONFIG_FILE = path.join(process.cwd(), '.admin-storage-config.json');

interface StorageConfig {
  url?: string;
  key?: string;
  bucket?: string;
}

function readStorageCache(): StorageConfig {
  if (process.env.VERCEL) return {};
  try {
    if (fs.existsSync(STORAGE_CONFIG_FILE)) {
      const content = fs.readFileSync(STORAGE_CONFIG_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read storage cache file:', err);
  }
  return {};
}

export function writeStorageCache(config: StorageConfig): void {
  if (process.env.VERCEL) return;
  try {
    const existing = readStorageCache();
    const updated = { ...existing, ...config };
    fs.writeFileSync(STORAGE_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write storage cache file:', err);
  }
}


export function resolveSupabaseConfig(): {
  url: string | null;
  key: string | null;
  projectRef: string | null;
  bucket: string;
  source: 'env' | 'cache' | 'inferred' | 'none';
} {
  const cache = readStorageCache();

  // 1. Check direct env vars
  let rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)?.trim() || null;
  let url = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '') : null;

  let key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY
  )?.trim() || null;
  let bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || cache.bucket || 'media';

  // 2. If url not set, infer projectRef from DATABASE_URL
  let projectRef: string | null = null;
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    const poolerMatch = dbUrl.match(/postgres\.([a-zA-Z0-9_-]+):/i);
    const directMatch = dbUrl.match(/db\.([a-zA-Z0-9_-]+)\.supabase\.co/i);
    if (poolerMatch && poolerMatch[1]) {
      projectRef = poolerMatch[1];
    } else if (directMatch && directMatch[1]) {
      projectRef = directMatch[1];
    }
  }

  if (!url && projectRef) {
    url = `https://${projectRef}.supabase.co`;
  }

  // 3. Fallback to cache if key not in env
  if (!key && cache.key) {
    key = cache.key;
  }
  if (!url && cache.url) {
    url = cache.url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  const source = (process.env.SUPABASE_URL || process.env.SUPABASE_ANON_KEY)
    ? 'env'
    : cache.key
    ? 'cache'
    : projectRef
    ? 'inferred'
    : 'none';

  return {
    url,
    key,
    projectRef,
    bucket,
    source,
  };
}

let cachedClient: SupabaseClient | null = null;
let lastClientKey: string | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = resolveSupabaseConfig();
  if (!config.url || !config.key) {
    return null;
  }

  const clientKey = `${config.url}_${config.key}`;
  if (cachedClient && lastClientKey === clientKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastClientKey = clientKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client for storage:', err);
    return null;
  }
}

/**
 * Ensures that the target public bucket exists in Supabase Storage.
 * If it doesn't exist, attempts to create it as a public bucket.
 */
export async function ensureBucketExists(bucketName: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase client is not configured with API key.',
    };
  }

  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      return {
        success: false,
        message: `Failed to list buckets: ${error.message}`,
      };
    }

    const found = buckets?.find((b) => b.name === bucketName || b.id === bucketName);
    if (found) {
      return {
        success: true,
        message: `Bucket "${bucketName}" exists and is active.`,
      };
    }

    // Attempt to create bucket
    const { error: createError } = await client.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });

    if (createError) {
      return {
        success: false,
        message: `Could not create bucket "${bucketName}": ${createError.message}. You can also create it as a Public bucket in the Supabase Dashboard.`,
      };
    }

    return {
      success: true,
      message: `Bucket "${bucketName}" created successfully with public access.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error verifying bucket: ${msg}`,
    };
  }
}

/**
 * Uploads a binary buffer to Supabase Storage and returns its public URL.
 */
export async function uploadBufferToSupabase(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string,
  folder: string = 'media'
): Promise<{
  success: boolean;
  url?: string;
  path?: string;
  bucket?: string;
  error?: string;
}> {
  const config = resolveSupabaseConfig();
  const client = getSupabaseClient();

  if (!client || !config.url) {
    return {
      success: false,
      error: 'Supabase Storage is not connected. Provide SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env or the Database tab.',
    };
  }

  // Support direct buckets (Cover_image, Videos, Avatar_image) or standard media bucket
  const knownDirectBuckets: Record<string, string> = {
    Cover_image: 'Cover_image',
    Videos: 'Videos',
    Avatar_image: 'Avatar_image',
    testimonials: 'Avatar_image',
    projects: 'Cover_image',
    videos: 'Videos',
  };

  const targetBucket = knownDirectBuckets[folder] || config.bucket || 'media';

  // Auto-verify / create bucket
  await ensureBucketExists(targetBucket);

  const cleanExt = path.extname(originalFileName) || (mimeType.includes('video') ? '.mp4' : '.jpg');
  const baseName = path
    .basename(originalFileName, cleanExt)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const filePath = `${Date.now()}_${baseName}_${randomSuffix}${cleanExt}`;

  try {
    const { data, error } = await client.storage
      .from(targetBucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        error: `Supabase upload error: ${error.message}`,
      };
    }

    const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(data.path);
    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
      bucket: targetBucket,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Storage upload failed: ${msg}`,
    };
  }
}

export async function createSignedUploadUrl(
  folder: string,
  originalFileName: string,
  mimeType: string
): Promise<{ success: boolean; signedUrl?: string; token?: string; path?: string; publicUrl?: string; bucket?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase Storage is not connected.' };
  }

  const knownDirectBuckets: Record<string, string> = {
    Cover_image: 'Cover_image',
    Videos: 'Videos',
    Avatar_image: 'Avatar_image',
    testimonials: 'Avatar_image',
    projects: 'Cover_image',
    videos: 'Videos',
  };
  const config = resolveSupabaseConfig();
  const targetBucket = knownDirectBuckets[folder] || config.bucket || 'media';
  await ensureBucketExists(targetBucket);

  const cleanExt = path.extname(originalFileName) || (mimeType.includes('video') ? '.mp4' : '.jpg');
  const baseName = path
    .basename(originalFileName, cleanExt)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const filePath = `${Date.now()}_${baseName}_${randomSuffix}${cleanExt}`;

  try {
    const { data, error } = await client.storage
      .from(targetBucket)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to generate signed upload URL' };
    }

    const { data: publicUrlData } = client.storage.from(targetBucket).getPublicUrl(filePath);

    return {
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
      bucket: targetBucket,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
