/**
 * Link xem ảnh (preview)
 */
export function getImageUrl(fileId: string): string {
  // lh3 thường hiển thị ảnh public ổn định
  return `https://lh3.googleusercontent.com/d/${fileId}=w600`;
}

/**
 * Link tải trực tiếp về máy
 * confirm=t giúp bỏ qua trang cảnh báo virus scan của Google Drive
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
}

/**
 * Link mở trang Drive
 */
export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
