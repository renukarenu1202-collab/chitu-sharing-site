export type FileCategory = 'image' | 'pdf' | 'doc' | 'sheet' | 'slide' | 'other';

export interface DrivePermission {
  id: string;
  type: string;
  role: string;
  allowFileDiscovery?: boolean;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  category: FileCategory;
  isPublic?: boolean;
  publicPermissionId?: string | null;
  publicShareUrl: string;
}

export interface UploadedFileRecord {
  id: string;
  name: string;
  mimeType: string;
  size?: number | string;
  category: FileCategory;
  publicShareUrl: string;
  directDownloadUrl?: string;
  previewUrl?: string;
  sourceType: 'device_upload' | 'google_photos_link' | 'google_drive_link' | 'web_link';
  uploadedAt: string;
  driveFileId?: string;
  isPublic: boolean;
}

export function detectFileCategory(mimeType: string, fileName = ''): FileCategory {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(name)) {
    return 'image';
  }
  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    /\.(doc|docx|txt|rtf|odt|pages|md)$/.test(name)
  ) {
    return 'doc';
  }
  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    /\.(xls|xlsx|csv|numbers|tsv)$/.test(name)
  ) {
    return 'sheet';
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    /\.(ppt|pptx|key)$/.test(name)
  ) {
    return 'slide';
  }
  return 'other';
}
