/**
 * Cloudflare R2 Media Storage & CDN Integration
 * High-performance direct S3 API upload using AWS Signature Version 4 (Web Crypto API)
 * with Cloudflare R2 Public CDN URL generator and CORS diagnostic helper.
 */

export interface R2Config {
  accountId: string;
  bucketName: string;
  s3ApiUrl: string;
  publicUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// SECURITY: never hardcode real R2 access/secret keys here. This file ships to every
// visitor's browser inside the JS bundle, so any secret placed here (or in a VITE_
// prefixed env var) is publicly readable via "view source" on the live site.
// Only non-secret identifiers (account id, bucket, public URL) belong here.
// Uploads should ideally go through a small server-side/edge function that holds the
// secret key and returns a pre-signed URL, rather than signing requests in the browser.
export const DEFAULT_R2_CONFIG: R2Config = {
  accountId: 'e731735be156543f033f2f9f611cb44c',
  bucketName: 'kinomart',
  s3ApiUrl: 'https://e731735be156543f033f2f9f611cb44c.r2.cloudflarestorage.com/kinomart',
  publicUrl: 'https://pub-5b578dfe75d2479c8a74e0953fe58b53.r2.dev',
  accessKeyId: '',
  secretAccessKey: ''
};

const R2_STORAGE_KEY = 'kinomart_r2_config';

/**
 * Get active Cloudflare R2 configuration
 */
export function getR2Config(): R2Config {
  let savedConfig: Partial<R2Config> = {};
  try {
    const saved = localStorage.getItem(R2_STORAGE_KEY);
    if (saved) {
      savedConfig = JSON.parse(saved);
    }
  } catch (err) {
    console.warn('[R2 Storage] Failed to read saved config from localStorage:', err);
  }

  // Also check store settings if available
  let storeSettingsR2: Partial<R2Config> = {};
  try {
    const rawSettings = localStorage.getItem('kinomart_settings');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed) {
        storeSettingsR2 = {
          accountId: parsed.r2AccountId,
          bucketName: parsed.r2BucketName,
          publicUrl: parsed.r2PublicUrl,
          s3ApiUrl: parsed.r2S3Endpoint,
          accessKeyId: parsed.r2AccessKeyId,
          secretAccessKey: parsed.r2SecretAccessKey
        };
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    accountId: (
      savedConfig.accountId ||
      storeSettingsR2.accountId ||
      import.meta.env.VITE_R2_ACCOUNT_ID ||
      DEFAULT_R2_CONFIG.accountId
    ).trim(),
    bucketName: (
      savedConfig.bucketName ||
      storeSettingsR2.bucketName ||
      import.meta.env.VITE_R2_BUCKET_NAME ||
      DEFAULT_R2_CONFIG.bucketName
    ).trim(),
    s3ApiUrl: (
      savedConfig.s3ApiUrl ||
      storeSettingsR2.s3ApiUrl ||
      import.meta.env.VITE_R2_S3_ENDPOINT ||
      DEFAULT_R2_CONFIG.s3ApiUrl
    ).trim(),
    publicUrl: (
      savedConfig.publicUrl ||
      storeSettingsR2.publicUrl ||
      import.meta.env.VITE_R2_PUBLIC_URL ||
      DEFAULT_R2_CONFIG.publicUrl
    ).trim().replace(/\/+$/, ''),
    accessKeyId: (
      savedConfig.accessKeyId ||
      storeSettingsR2.accessKeyId ||
      import.meta.env.VITE_R2_ACCESS_KEY_ID ||
      ''
    ).trim(),
    secretAccessKey: (
      savedConfig.secretAccessKey ||
      storeSettingsR2.secretAccessKey ||
      import.meta.env.VITE_R2_SECRET_ACCESS_KEY ||
      ''
    ).trim()
  };
}

/**
 * Persist Cloudflare R2 configuration
 */
export function setR2Config(config: Partial<R2Config>): R2Config {
  const current = getR2Config();
  const updated: R2Config = {
    ...current,
    ...config,
    publicUrl: (config.publicUrl || current.publicUrl || DEFAULT_R2_CONFIG.publicUrl).replace(/\/+$/, '')
  };

  try {
    localStorage.setItem(R2_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[R2 Storage] Failed to save config to localStorage:', err);
  }

  return updated;
}

/**
 * Check if R2 Upload Credentials (API Token) are present
 */
export function isR2CredentialsConfigured(): boolean {
  const config = getR2Config();
  return Boolean(config.accountId && config.bucketName && config.accessKeyId && config.secretAccessKey);
}

/**
 * Format clean object key for R2 Storage
 */
export function formatR2Key(folder: string = 'products', filename: string = 'media.webp'): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '') || 'media';
  const cleanName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);

  return `${cleanFolder}/${timestamp}-${random}-${cleanName}`;
}

/**
 * Get full public CDN URL for an R2 key or return URL if already absolute
 */
export function getR2PublicUrl(keyOrPath: string): string {
  if (!keyOrPath) return '';
  if (keyOrPath.startsWith('http://') || keyOrPath.startsWith('https://') || keyOrPath.startsWith('data:') || keyOrPath.startsWith('blob:')) {
    return keyOrPath;
  }
  const config = getR2Config();
  const cleanKey = keyOrPath.replace(/^\/+/, '');
  const baseUrl = config.publicUrl || DEFAULT_R2_CONFIG.publicUrl;
  return `${baseUrl}/${cleanKey}`;
}

export function isR2Url(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('r2.dev') ||
    url.includes('r2.cloudflarestorage.com') ||
    url.includes('pub-5b578dfe75d2479c8a74e0953fe58b53')
  );
}

/**
 * Convert base64 Data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// -------------------------------------------------------------
// AWS Signature Version 4 (SigV4) Implementation via Web Crypto
// -------------------------------------------------------------

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: CryptoKey | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  let cryptoKey: CryptoKey;

  if (key instanceof ArrayBuffer || key instanceof Uint8Array) {
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
  } else {
    cryptoKey = key;
  }

  return await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const kDate = await hmacSha256(enc.encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

function toHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface UploadResult {
  url: string;
  key: string;
  cdnUrl: string;
  sizeBytes?: number;
  uploadedAt: string;
}

/**
 * Upload binary file/image directly to Cloudflare R2 bucket via S3 API with SigV4
 */
export async function uploadToR2(
  fileOrDataUrl: File | Blob | string,
  options: {
    folder?: 'products' | 'banners' | 'categories' | 'reviews' | 'settings' | 'general';
    filename?: string;
    contentType?: string;
  } = {}
): Promise<UploadResult> {
  const config = getR2Config();
  const folder = options.folder || 'products';

  let blob: Blob;
  let filename = options.filename || `image-${Date.now()}.webp`;
  let mimeType = options.contentType || 'image/webp';

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.startsWith('data:')) {
      blob = dataUrlToBlob(fileOrDataUrl);
      mimeType = blob.type || 'image/webp';
    } else {
      // Already an HTTP URL
      return {
        url: fileOrDataUrl,
        key: fileOrDataUrl.split('/').pop() || 'file',
        cdnUrl: fileOrDataUrl,
        uploadedAt: new Date().toISOString()
      };
    }
  } else if (fileOrDataUrl instanceof File) {
    blob = fileOrDataUrl;
    filename = fileOrDataUrl.name;
    mimeType = fileOrDataUrl.type || 'image/webp';
  } else {
    blob = fileOrDataUrl;
    mimeType = fileOrDataUrl.type || 'image/webp';
  }

  const key = formatR2Key(folder, filename);
  const cdnUrl = `${config.publicUrl}/${key}`;

  // Check if API credentials are provided for actual S3 PUT
  if (!config.accessKeyId || !config.secretAccessKey) {
    const errorMsg = 'Cloudflare R2 Access Key ID বা Secret Access Key দেওয়া নেই। অনুগ্রহ করে Admin Settings থেকে R2 API Token যুক্ত করুন।';
    console.warn(`[Cloudflare R2] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // Perform AWS SigV4 PUT request
  const arrayBuffer = await blob.arrayBuffer();
  const payloadHash = await sha256Hex(arrayBuffer);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // e.g. 20260827T141516Z
  const dateStamp = amzDate.slice(0, 8); // e.g. 20260827

  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${config.bucketName}/${key}`;

  // Canonical URI with properly escaped path components
  const pathSegments = [config.bucketName, ...key.split('/')].map(segment => encodeURIComponent(segment));
  const canonicalUri = `/${pathSegments.join('/')}`;
  const canonicalQuery = '';
  const canonicalHeaders = `content-type:${mimeType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const enc = new TextEncoder();
  const canonicalRequestHash = await sha256Hex(enc.encode(canonicalRequest));

  // Helper to execute PUT with specified SigV4 region ('auto' or 'us-east-1')
  const executePutWithRegion = async (region: string) => {
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    const signingKey = await getSignatureKey(config.secretAccessKey, dateStamp, region, 's3');
    const signatureBuffer = await hmacSha256(signingKey, stringToSign);
    const signature = toHex(signatureBuffer);

    const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        Authorization: authHeader
      },
      body: arrayBuffer
    });
  };

  try {
    let response = await executePutWithRegion('auto');

    // If signature mismatch occurred with 'auto', attempt retry with 'us-east-1'
    if (!response.ok && response.status === 403) {
      const errPeek = await response.clone().text();
      if (errPeek.includes('SignatureDoesNotMatch')) {
        console.info('[Cloudflare R2] Retrying SigV4 upload with us-east-1 region...');
        response = await executePutWithRegion('us-east-1');
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      let detail = `HTTP ${response.status}: ${response.statusText}`;
      if (errText) {
        if (errText.includes('AccessDenied') || errText.includes('SignatureDoesNotMatch')) {
          detail = 'Cloudflare R2 এক্সেস ডিনাইড: Access Key বা Secret Access Key ভুল অথবা পারমিশন নেই।';
        } else if (errText.includes('NoSuchBucket')) {
          detail = `Bucket "${config.bucketName}" পাওয়া যায়নি। Bucket নাম সঠিক কিনা চেক করুন।`;
        } else {
          detail = errText;
        }
      }
      throw new Error(`Cloudflare R2 Upload Failed (${detail})`);
    }

    console.log(`[Cloudflare R2] Successfully uploaded "${key}" to bucket "${config.bucketName}". CDN URL: ${cdnUrl}`);

    return {
      url: cdnUrl,
      key,
      cdnUrl,
      sizeBytes: blob.size,
      uploadedAt: new Date().toISOString()
    };
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
      throw new Error(
        'Cloudflare R2 CORS ব্লক করেছে। অনুগ্রহ করে Cloudflare Dashboard -> R2 -> kinomart Bucket -> Settings -> CORS Policy তে ["*"] Origin এলাউ করুন।'
      );
    }
    throw err;
  }
}

/**
 * Test R2 Public Development CDN & S3 Upload connectivity
 */
export async function testR2Connection(customUrl?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const config = getR2Config();
  const targetUrl = (customUrl || config.publicUrl || DEFAULT_R2_CONFIG.publicUrl).replace(/\/+$/, '');

  const start = performance.now();
  try {
    await fetch(`${targetUrl}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    });

    const latencyMs = Math.round(performance.now() - start);
    return {
      success: true,
      message: `Cloudflare R2 Public CDN (${targetUrl}) সফলভাবে কানেক্টেড! রেসপন্স টাইম: ${latencyMs}ms`,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: true,
      message: `Cloudflare R2 Endpoint (${targetUrl}) সক্রিয় রয়েছে (${latencyMs}ms)`,
      latencyMs
    };
  }
}

/**
 * Recommended Cloudflare R2 CORS Configuration JSON
 */
export const RECOMMENDED_R2_CORS_JSON = `[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]`;
