/**
 * Link hiển thị ảnh trên web
 */
export function getImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

/**
 * Link mở trang Drive
 */
export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Link tải qua server Vercel (không hỏi tài khoản Google)
 */
export function getProxyDownloadUrl(fileId: string, filename: string): string {
  const name = encodeURIComponent(filename);
  return `/api/download?id=${encodeURIComponent(fileId)}&name=${name}`;
}

/**
 * Tải ảnh về máy qua proxy cùng domain
 */
export async function downloadImage(
  fileId: string,
  filename: string
): Promise<void> {
  const safeName =
    filename.endsWith('.png') ||
    filename.endsWith('.jpg') ||
    filename.endsWith('.jpeg') ||
    filename.endsWith('.webp')
      ? filename
      : `${filename}.png`;

  const url = getProxyDownloadUrl(fileId, safeName);

  // Tải về thành blob từ domain của mình
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      errText || 'Không tải được ảnh. Kiểm tra file Drive đã share công khai chưa.'
    );
  }

  const blob = await res.blob();
  if (blob.size < 500 || (blob.type || '').includes('text/html')) {
    throw new Error('File trả về không phải ảnh hợp lệ.');
  }

  // Mobile: Share / Lưu ảnh
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], safeName, {
        type: blob.type || 'image/png',
      });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: safeName });
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  // Tải thẳng về máy
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = safeName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objUrl), 3000);
}
