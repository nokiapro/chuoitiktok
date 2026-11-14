import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Proxy tải ảnh từ Google Drive
 * Browser chỉ gọi domain Vercel → không bị hỏi chọn tài khoản Google
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const fileId = String(req.query.id || '').trim();
  const name = String(req.query.name || `streak-${fileId}`).replace(
    /[^\w.\-() \u00C0-\u024F]+/g,
    '_'
  );

  if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file id' });
  }

  const candidates = [
    `https://lh3.googleusercontent.com/d/${fileId}=s0`,
    `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`,
  ];

  for (const url of candidates) {
    try {
      const upstream = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!upstream.ok) continue;

      const contentType = upstream.headers.get('content-type') || '';
      if (contentType.includes('text/html')) continue;

      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.length < 1000) continue;

      const type = contentType.startsWith('image/')
        ? contentType
        : 'image/png';

      const filename = name.match(/\.(png|jpe?g|webp|gif)$/i)
        ? name
        : `${name}.png`;

      res.setHeader('Content-Type', type);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    } catch {
      // thử url tiếp
    }
  }

  return res.status(404).json({
    error: 'Không lấy được ảnh. Kiểm tra file đã share Anyone with the link.',
  });
}
