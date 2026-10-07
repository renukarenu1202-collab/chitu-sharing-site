export interface ImageMediaMetadata {
  width?: number;
  height?: number;
  rotation?: number;
  location?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
  };
  time?: string;
  cameraMake?: string;
  cameraModel?: string;
  exposureTime?: number;
  aperture?: number;
  flashUsed?: boolean;
  focalLength?: number;
  isoSpeed?: number;
  meteringMode?: string;
  sensor?: string;
  exposureMode?: string;
  colorSpace?: string;
  whiteBalance?: string;
  exposureBias?: number;
  maxApertureValue?: number;
  subjectDistance?: number;
  lens?: string;
}

export interface DrivePermission {
  id: string;
  type: string; // 'anyone', 'user', 'group', 'domain'
  role: string; // 'reader', 'commenter', 'writer', 'owner'
  allowFileDiscovery?: boolean;
}

export interface DrivePhotoItem {
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
  imageMediaMetadata?: ImageMediaMetadata;
  shared?: boolean;
  permissions?: DrivePermission[];
  owners?: Array<{
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  }>;
  isPublic?: boolean;
  publicPermissionId?: string | null;
}

export type ViewMode = 'grid' | 'compact' | 'list';
export type FilterType = 'all' | 'public' | 'private';
export type SortOption = 'newest' | 'oldest' | 'name' | 'size';
