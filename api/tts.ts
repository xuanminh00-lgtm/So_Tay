import https from 'https';

export default function handler(req: any, res: any) {
  const host = req.headers?.host || 'localhost';
  const url = new URL(req.url || '', `http://${host}`);
  const text = req.query?.text || url.searchParams.get('text');

  if (!text || typeof text !== 'string' || !text.trim()) {
    if (typeof res.status === 'function') {
      return res.status(400).send('Thiếu nội dung văn bản (text)');
    }
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Thiếu nội dung văn bản (text)');
    return;
  }

  const queryText = encodeURIComponent(text.trim());
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${queryText}`;

  const proxyReq = https.get(
    ttsUrl,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    },
    (ttsRes) => {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.statusCode = ttsRes.statusCode || 200;
      ttsRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('Lỗi proxy TTS Vercel:', err);
    if (typeof res.status === 'function') {
      return res.status(500).send('Lỗi máy chủ TTS');
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Lỗi máy chủ TTS');
  });
}
