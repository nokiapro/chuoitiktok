/**
 * Extract Google Drive File ID from various link formats
 */
export function extractFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Already a pure file ID (no slash, reasonable length)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // https://drive.google.com/open?id=FILE_ID
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // https://drive.google.com/uc?id=FILE_ID
  const ucMatch = trimmed.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) return ucMatch[1];

  return null;
}

/**
 * Generate a viewable image URL from File ID
 */
export function getImageUrl(fileId: string): string {
  // lh3 works well for many public Drive images
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

/**
 * Generate a direct download URL
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Generate a preview/view page URL
 */
export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
