import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    responseLimit: '10mb',
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const fileId = String(req.query.id || '').trim();
  let name = String(req.query.name || `streak-${fileId}`);
  name = name.replace(/[^\w.\-() \u00C0-\u024F]+/g, '_').slice(0, 80);

  if (!fileId || !/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file id', fileId });
  }

  const candidates = [
    `https://lh3.googleusercontent.com/d/${fileId}=s0`,
    `https://lh3.googleusercontent.com/d/${fileId}=w2000`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
  ];

  const errors: string[] = [];

  for (const url of candidates) {
    try {
      const upstream = await fetch(url, {
        redirect: 'follow',
        headers: {
          Accept: 'image/*,*/*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!upstream.ok) {
        errors.push(`${url} => HTTP ${upstream.status}`);
        continue;
      }

      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        errors.push(`${url} => html`);
        continue;
      }

      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.length < 500) {
        errors.push(`${url} => too small ${buffer.length}`);
        continue;
      }

      const type = contentType.startsWith('image/')
        ? contentType.split(';')[0]
        : 'image/png';

      const filename = /\.(png|jpe?g|webp|gif)$/i.test(name)
        ? name
        : `${name}.png`;

      res.setHeader('Content-Type', type);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Length', String(buffer.length));
      return res.status(200).send(buffer);
    } catch (e: unknown) {
      errors.push(
        `${url} => ${e instanceof Error ? e.message : 'fetch error'}`
      );
    }
  }

  return res.status(404).json({
    error: 'Không lấy được ảnh. Kiểm tra file đã share Anyone with the link.',
    fileId,
    errors,
  });
}
