import express, { Request, Response } from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FASTAPI_PORT = 8001;
const FASTAPI_URL = `http://127.0.0.1:${FASTAPI_PORT}`;

// Launch Python FastAPI backend as a child process
let pythonProc: ChildProcess | null = null;

function startFastAPI() {
  console.log('[System] Launching FastAPI backend on port 8001...');
  pythonProc = spawn('python3', ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', `${FASTAPI_PORT}`], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: process.cwd() }
  });

  pythonProc.on('error', (err) => {
    console.error('[System] Failed to start Python FastAPI process:', err);
  });

  pythonProc.on('exit', (code, signal) => {
    console.log(`[System] FastAPI process exited with code ${code} signal ${signal}`);
  });
}

startFastAPI();

// Clean up child process on exit
process.on('SIGINT', () => {
  if (pythonProc) pythonProc.kill('SIGINT');
  process.exit();
});
process.on('SIGTERM', () => {
  if (pythonProc) pythonProc.kill('SIGTERM');
  process.exit();
});

// Parse json & urlencoded for fallback handling if needed
app.use(express.json({ limit: '10mb' }));

// Forward all /api requests to FastAPI backend
app.all('/api/*', async (req: Request, res: Response) => {
  const targetUrl = `${FASTAPI_URL}${req.originalUrl}`;
  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': req.get('Content-Type') || 'application/json',
        'Accept': req.get('Accept') || 'application/json',
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const backendRes = await fetch(targetUrl, fetchOptions);
    const contentType = backendRes.headers.get('content-type') || '';
    
    res.status(backendRes.status);
    backendRes.headers.forEach((val, key) => {
      // Don't forward content-encoding if decompressed
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        res.setHeader(key, val);
      }
    });

    if (contentType.includes('application/json')) {
      const data = await backendRes.json();
      return res.json(data);
    } else {
      const text = await backendRes.text();
      return res.send(text);
    }
  } catch (err: any) {
    // If backend is still starting up
    if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      return res.status(503).json({
        detail: 'FastAPI backend service is currently initializing. Please retry in a moment.',
        connected: false
      });
    }
    return res.status(500).json({
      detail: 'API gateway proxy error.',
      error: err.message
    });
  }
});

// Also proxy /docs and /openapi.json for API documentation exploration
app.all(['/docs', '/redoc', '/openapi.json'], async (req: Request, res: Response) => {
  try {
    const targetUrl = `${FASTAPI_URL}${req.originalUrl}`;
    const backendRes = await fetch(targetUrl);
    res.status(backendRes.status);
    const text = await backendRes.text();
    const contentType = backendRes.headers.get('content-type') || 'text/html';
    res.setHeader('content-type', contentType);
    return res.send(text);
  } catch (err) {
    return res.status(503).send('FastAPI documentation initializing...');
  }
});

// Vite Middleware Integration for Development / Static serving for production
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SKILL//INTELLIGENCE] Unified server running at http://localhost:${PORT}`);
    console.log(`[SKILL//INTELLIGENCE] FastAPI documentation available at http://localhost:${PORT}/docs`);
  });
}

setupVite().catch((err) => {
  console.error('[SKILL//INTELLIGENCE] Server startup failure:', err);
});
