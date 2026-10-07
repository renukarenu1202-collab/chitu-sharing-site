import { DrivePhotoItem, DrivePermission } from '../types/photos';
import { getAccessToken } from './auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export interface FetchImagesParams {
  pageSize?: number;
  pageToken?: string | null;
  searchQuery?: string;
  orderBy?: string;
}

export interface FetchImagesResult {
  items: DrivePhotoItem[];
  nextPageToken: string | null;
}

export function parsePhotoItem(file: any): DrivePhotoItem {
  const permissions: DrivePermission[] = Array.isArray(file.permissions) ? file.permissions : [];
  const publicPerm = permissions.find((p) => p.type === 'anyone');

  return {
    id: file.id,
    name: file.name || 'Untitled Image',
    mimeType: file.mimeType || 'image/jpeg',
    description: file.description || '',
    webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view?usp=sharing`,
    webContentLink: file.webContentLink || `https://drive.google.com/uc?export=download&id=${file.id}`,
    thumbnailLink: file.thumbnailLink,
    iconLink: file.iconLink,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    size: file.size,
    imageMediaMetadata: file.imageMediaMetadata,
    shared: !!file.shared,
    permissions,
    owners: file.owners,
    isPublic: Boolean(publicPerm),
    publicPermissionId: publicPerm ? publicPerm.id : null,
  };
}

export async function fetchDriveImages(
  params: FetchImagesParams = {}
): Promise<FetchImagesResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google to view images.');
  }

  const { pageSize = 50, pageToken, searchQuery, orderBy = 'createdTime desc' } = params;

  let q = "mimeType contains 'image/' and trashed = false";
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const queryParams = new URLSearchParams({
    q,
    pageSize: pageSize.toString(),
    fields:
      'nextPageToken, files(id, name, mimeType, description, webViewLink, webContentLink, thumbnailLink, iconLink, createdTime, modifiedTime, size, imageMediaMetadata, shared, permissions(id, type, role, allowFileDiscovery), owners(displayName, emailAddress, photoLink))',
    orderBy,
    spaces: 'drive,photos',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  if (pageToken) {
    queryParams.append('pageToken', pageToken);
  }

  let res = await fetch(`${DRIVE_API_BASE}/files?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  // If photos space isn't accepted, retry with standard drive space
  if (!res.ok && res.status === 400) {
    queryParams.set('spaces', 'drive');
    res = await fetch(`${DRIVE_API_BASE}/files?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData?.error?.message || `Failed to fetch images from Google Drive (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  const rawFiles = Array.isArray(data.files) ? data.files : [];
  const items = rawFiles.map(parsePhotoItem);

  return {
    items,
    nextPageToken: data.nextPageToken || null,
  };
}

/**
 * Creates a public shareable permission on the specified Google Drive file.
 * Role: 'reader', Type: 'anyone'
 */
export async function makeFilePublic(fileId: string): Promise<DrivePermission> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
      allowFileDiscovery: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to make photo publicly shareable');
  }

  return (await res.json()) as DrivePermission;
}

/**
 * Revokes public access by deleting the 'anyone' permission from the file.
 */
export async function revokeFilePublic(
  fileId: string,
  permissionId?: string | null
): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  let targetId = permissionId;

  // If targetId is not provided, fetch the permissions list to locate the 'anyone' permission
  if (!targetId) {
    const listRes = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions?fields=permissions(id,type,role)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const match = (data.permissions || []).find((p: any) => p.type === 'anyone');
      if (match) {
        targetId = match.id;
      }
    }
  }

  if (!targetId) {
    // Default fallback identifier in Google Drive v3
    targetId = 'anyoneWithLink';
  }

  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions/${targetId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Failed to revoke public access');
  }
}

/**
 * Batch make multiple files public with sequential or throttled parallel requests
 */
export async function batchMakePublic(
  fileIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (let i = 0; i < fileIds.length; i++) {
    const id = fileIds[i];
    try {
      await makeFilePublic(id);
      success.push(id);
    } catch (err: any) {
      failed.push({ id, error: err?.message || 'Unknown error' });
    }
    if (onProgress) {
      onProgress(i + 1, fileIds.length);
    }
  }

  return { success, failed };
}

/**
 * Batch revoke public access on multiple files
 */
export async function batchRevokePublic(
  items: Array<{ fileId: string; permissionId?: string | null }>,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: string[]; failed: { id: string; error: string }[] }> {
  const success: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await revokeFilePublic(item.fileId, item.permissionId);
      success.push(item.fileId);
    } catch (err: any) {
      failed.push({ id: item.fileId, error: err?.message || 'Unknown error' });
    }
    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return { success, failed };
}

export function getPublicViewerUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export function getDirectImageUrl(fileId: string, size = 1600): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
}

export function getDirectDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
