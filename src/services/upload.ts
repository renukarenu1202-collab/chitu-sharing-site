import { DrivePhotoItem } from '../types/photos';
import { getAccessToken } from './auth';
import { parsePhotoItem, makeFilePublic, getPublicViewerUrl } from './drive';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface UploadedPhotoRecord {
  id: string;
  sourceType:
    | 'drive_upload'
    | 'drive_link'
    | 'google_photos_link'
    | 'custom_link'
    | 'drive_public';
  name: string;
  originalUrl: string;
  publicShareUrl: string;
  previewUrl: string;
  downloadUrl?: string;
  mimeType: string;
  size?: number | string;
  width?: number;
  height?: number;
  uploadedAt: string;
  driveFileId?: string;
  isPublic: boolean;
}

const STORAGE_KEY = 'ais_uploaded_photos_records';

export function getStoredUploads(): UploadedPhotoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredUpload(record: UploadedPhotoRecord): void {
  try {
    const current = getStoredUploads();
    const updated = [record, ...current.filter((item) => item.id !== record.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save to localStorage', err);
  }
}

export function removeStoredUpload(id: string): void {
  try {
    const current = getStoredUploads();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not remove from localStorage', err);
  }
}

/**
 * Extracts Google Drive File ID from various URL formats
 */
export function extractDriveFileId(url: string): string | null {
  const cleanUrl = url.trim();

  // Pattern 1: https://drive.google.com/file/d/{id}/view
  const matchFileD = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: https://drive.google.com/open?id={id} or uc?id={id}
  const matchIdParam = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: direct ID string (alphanumeric with underscores/dashes, min length 25)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

/**
 * Detects if a URL is from Google Photos
 */
export function isGooglePhotosUrl(url: string): boolean {
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('photos.app.goo.gl') ||
    clean.includes('photos.google.com/share') ||
    clean.includes('photos.google.com/photo') ||
    clean.includes('photos.google.com/album')
  );
}

/**
 * Upload a local image file directly to Google Drive using multipart upload
 */
export async function uploadFileToGoogleDrive(
  file: File,
  makePublicOption = true,
  onProgress?: (percent: number) => void
): Promise<{ photoItem: DrivePhotoItem; record: UploadedPhotoRecord }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('You must be signed in with Google to upload photos to Drive.');
  }

  // 1. Prepare metadata
  const metadata = {
    name: file.name,
    mimeType: file.type || 'image/jpeg',
    description: 'Uploaded via Photos Share Gallery with public link',
  };

  // 2. Build multipart body
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileDataPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

  const arrayBuffer = await fileDataPromise;
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;

  const mediaHeader = `${delimiter}Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`;

  const textEncoder = new TextEncoder();
  const metadataBytes = textEncoder.encode(metadataPart);
  const mediaHeaderBytes = textEncoder.encode(mediaHeader);
  const closeBytes = textEncoder.encode(closeDelimiter);

  const totalLength =
    metadataBytes.byteLength +
    mediaHeaderBytes.byteLength +
    arrayBuffer.byteLength +
    closeBytes.byteLength;

  const combined = new Uint8Array(totalLength);
  let offset = 0;

  combined.set(metadataBytes, offset);
  offset += metadataBytes.byteLength;

  combined.set(mediaHeaderBytes, offset);
  offset += mediaHeaderBytes.byteLength;

  combined.set(new Uint8Array(arrayBuffer), offset);
  offset += arrayBuffer.byteLength;

  combined.set(closeBytes, offset);

  // 3. Send upload request
  const res = await fetch(
    `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,description,webViewLink,webContentLink,thumbnailLink,iconLink,createdTime,modifiedTime,size,imageMediaMetadata,shared,permissions(id,type,role),owners(displayName,emailAddress,photoLink)`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to upload image (${res.status})`);
  }

  const fileData = await res.json();
  const photoItem = parsePhotoItem(fileData);

  // 4. Optionally make publicly accessible immediately
  let isPublic = false;
  let publicUrl = photoItem.webViewLink || getPublicViewerUrl(photoItem.id);

  if (makePublicOption) {
    try {
      await makeFilePublic(photoItem.id);
      photoItem.isPublic = true;
      isPublic = true;
    } catch (permErr) {
      console.warn('Could not set public permission on uploaded file:', permErr);
    }
  }

  const record: UploadedPhotoRecord = {
    id: `upload-${photoItem.id}`,
    sourceType: 'drive_upload',
    name: photoItem.name,
    originalUrl: photoItem.webViewLink || publicUrl,
    publicShareUrl: publicUrl,
    previewUrl:
      photoItem.thumbnailLink ||
      `https://lh3.googleusercontent.com/d/${photoItem.id}=w1600`,
    downloadUrl: photoItem.webContentLink,
    mimeType: photoItem.mimeType,
    size: file.size,
    width: photoItem.imageMediaMetadata?.width,
    height: photoItem.imageMediaMetadata?.height,
    uploadedAt: new Date().toISOString(),
    driveFileId: photoItem.id,
    isPublic,
  };

  saveStoredUpload(record);

  return { photoItem, record };
}

/**
 * Import a photo using an existing Google Drive shareable link
 */
export async function importFromDriveLink(
  driveLink: string
): Promise<{ photoItem?: DrivePhotoItem; record: UploadedPhotoRecord }> {
  const fileId = extractDriveFileId(driveLink);
  if (!fileId) {
    throw new Error('Invalid Google Drive link. Please enter a valid drive.google.com link.');
  }

  const token = await getAccessToken();
  const publicUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  const directCdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1600`;

  let name = `Google Drive Photo (${fileId.slice(0, 8)})`;
  let mimeType = 'image/jpeg';
  let size: string | undefined = undefined;
  let width: number | undefined = undefined;
  let height: number | undefined = undefined;
  let isPublic = true;
  let photoItem: DrivePhotoItem | undefined = undefined;

  // If user has token, query Drive API for rich details
  if (token) {
    try {
      const res = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,description,webViewLink,webContentLink,thumbnailLink,iconLink,createdTime,modifiedTime,size,imageMediaMetadata,shared,permissions(id,type,role),owners(displayName,emailAddress,photoLink)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        photoItem = parsePhotoItem(data);
        name = photoItem.name;
        mimeType = photoItem.mimeType;
        size = photoItem.size;
        width = photoItem.imageMediaMetadata?.width;
        height = photoItem.imageMediaMetadata?.height;
        isPublic = !!photoItem.isPublic;
      }
    } catch {
      // Continue with standard link format if API fails or item belongs to external account
    }
  }

  const record: UploadedPhotoRecord = {
    id: `drive-link-${fileId}`,
    sourceType: 'drive_link',
    name,
    originalUrl: driveLink.trim(),
    publicShareUrl: publicUrl,
    previewUrl: directCdnUrl,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
    mimeType,
    size,
    width,
    height,
    uploadedAt: new Date().toISOString(),
    driveFileId: fileId,
    isPublic,
  };

  saveStoredUpload(record);

  return { photoItem, record };
}

/**
 * Import a photo using a Google Photos shared public link
 */
export async function importFromGooglePhotosLink(
  photosUrl: string,
  customTitle?: string
): Promise<UploadedPhotoRecord> {
  const cleanUrl = photosUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    throw new Error('Please enter a valid link starting with https://');
  }

  // Create a record for the Google Photos shared link
  const id = `gphotos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title =
    customTitle?.trim() ||
    `Google Photos Album/Photo (${new Date().toLocaleDateString()})`;

  const record: UploadedPhotoRecord = {
    id,
    sourceType: 'google_photos_link',
    name: title,
    originalUrl: cleanUrl,
    publicShareUrl: cleanUrl,
    // Google Photos shared links redirect or display directly
    previewUrl: cleanUrl,
    mimeType: 'image/jpeg',
    uploadedAt: new Date().toISOString(),
    isPublic: true,
  };

  saveStoredUpload(record);
  return record;
}
