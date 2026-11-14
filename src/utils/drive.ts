const ADVANCE_URL =
  'https://script.google.com/macros/s/AKfycbxKb-sn_5PShthkgPo7dQmFGi9KCw0WZFG9pdEY4FdClhaMXwDch2e9WYJJ9a-7OGeE/exec';

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

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime || 'image/png' });
}

/**
 * Tải ảnh qua Apps Script (không hỏi tài khoản Google trên mobile)
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

  const url =
    `${ADVANCE_URL}?action=download` +
    `&id=${encodeURIComponent(fileId)}`;

  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await res.text();

  let json: {
    ok?: boolean;
    error?: string;
    data?: string;
    mime?: string;
    name?: string;
  };

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(
      'Script trả về dữ liệu không hợp lệ. Hãy cập nhật & deploy lại Apps Script.'
    );
  }

  if (!json.ok || !json.data) {
    throw new Error(json.error || 'Không tải được ảnh từ Drive.');
  }

  const mime = json.mime || 'image/png';
  const blob = base64ToBlob(json.data, mime);

  // Mobile: Share / Lưu ảnh
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], safeName, { type: mime });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: safeName });
        return;
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  // Tải thẳng
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
