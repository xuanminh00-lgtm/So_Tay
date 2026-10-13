import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Endpoint phát giọng nói tiếng Việt chuẩn miền Bắc (Server-side Proxy loại bỏ 100% lỗi CORS & lỗi iFrame)
  app.get('/api/tts', (req, res) => {
    const text = req.query.text as string;
    if (!text) {
      return res.status(400).send('Thiếu nội dung văn bản (text)');
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text.trim())}`;

    const request = https.get(ttsUrl, (ttsRes) => {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      ttsRes.pipe(res);
    });

    request.on('error', (err) => {
      console.error('Lỗi yêu cầu TTS:', err);
      res.status(500).send('Lỗi máy chủ TTS');
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Quản Bạ đang chạy tại http://0.0.0.0:${PORT}`);
  });
}

startServer();
