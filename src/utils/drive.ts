const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxKb-sn_5PShthkgPo7dQmFGi9KCw0WZFG9pdEY4FdClhaMXwDch2e9WYJJ9a-7OGeE/exec';

export function getImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

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

function triggerBlobDownload(blob: Blob, filename: string) {
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
}

async function fetchImageFromScript(fileId: string): Promise<{
  blob: Blob;
  mime: string;
  name: string;
}> {
  const url = `${SCRIPT_URL}?action=download&id=${encodeURIComponent(fileId)}`;
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
    throw new Error('Script trả về dữ liệu không hợp lệ');
  }

  if (!json.ok || !json.data) {
    throw new Error(json.error || 'Không tải được ảnh');
  }

  const mime = json.mime || 'image/png';
  return {
    blob: base64ToBlob(json.data, mime),
    mime,
    name: json.name || fileId,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Tải 1 ảnh */
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

  const { blob, mime } = await fetchImageFromScript(fileId);

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

  triggerBlobDownload(blob, safeName);
}

/**
 * Tải nhiều ảnh riêng lẻ (không zip)
 * - Lấy hết ảnh về bộ nhớ trước
 * - Rồi mới bắn download lần lượt (giảm thiếu file)
 */
export async function downloadImagesSeparate(
  items: { fileId: string; filename: string }[],
  onProgress?: (done: number, total: number, phase: 'fetch' | 'save') => void
): Promise<{ saved: number; failed: string[] }> {
  if (items.length === 0) {
    throw new Error('Không có ảnh để tải');
  }

  const prepared: { blob: Blob; filename: string }[] = [];
  const failed: string[] = [];

  // Phase 1: fetch all
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(i + 1, items.length, 'fetch');
    try {
      const { blob } = await fetchImageFromScript(item.fileId);
      const filename =
        item.filename.endsWith('.png') ||
        item.filename.endsWith('.jpg') ||
        item.filename.endsWith('.jpeg') ||
        item.filename.endsWith('.webp')
          ? item.filename
          : `${item.filename}.png`;
      prepared.push({ blob, filename });
    } catch {
      failed.push(item.filename);
    }
  }

  // Phase 2: trigger downloads sequentially
  let saved = 0;
  for (let i = 0; i < prepared.length; i++) {
    onProgress?.(i + 1, prepared.length, 'save');
    triggerBlobDownload(prepared[i].blob, prepared[i].filename);
    saved++;
    // Giãn cách để Chrome/Android kịp nhận từng file
    if (i < prepared.length - 1) {
      await sleep(700);
    }
  }

  return { saved, failed };
}
