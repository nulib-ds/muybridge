import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const GIF_EXPORT_ROUTE = '/api/export-gif';
const GIF_EXPORT_CONTENT_TYPE = 'application/json';

function sanitizePlateNumber(value: string | null) {
  if (!value) {
    return null;
  }
  const digits = value.match(/\d+/g)?.join('-');
  return digits ?? null;
}

async function collectRequestBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', (error) => reject(error));
  });
}

async function writeGifToDisk(root: string, plateNumber: string, contents: Buffer) {
  const directory = resolve(root, 'public', 'images');
  await mkdir(directory, { recursive: true });
  const fileName = `muybrudge-${plateNumber}.gif`;
  const filePath = resolve(directory, fileName);
  await writeFile(filePath, contents);
  return {
    filePath,
    publicPath: `/images/${fileName}`,
    fileName,
  };
}

async function handleGifExportRequest(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<boolean> {
  if (!req.url || req.method !== 'POST') {
    return false;
  }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== GIF_EXPORT_ROUTE) {
    return false;
  }
  const plateNumber = sanitizePlateNumber(url.searchParams.get('plateNumber'));
  if (!plateNumber) {
    res.statusCode = 400;
    res.end('Missing plate number');
    return true;
  }
  try {
    const body = await collectRequestBody(req);
    if (!body.length) {
      res.statusCode = 400;
      res.end('Empty GIF payload');
      return true;
    }
    const { filePath, publicPath, fileName } = await writeGifToDisk(root, plateNumber, body);
    res.statusCode = 201;
    res.setHeader('Content-Type', GIF_EXPORT_CONTENT_TYPE);
    res.end(
      JSON.stringify({
        ok: true,
        filePath,
        fileName,
        publicPath,
      }),
    );
    return true;
  } catch (error) {
    console.error('Failed to persist GIF export', error);
    res.statusCode = 500;
    res.end('Failed to write GIF to disk');
    return true;
  }
}

function gifExportPlugin(): Plugin {
  let projectRoot = process.cwd();
  return {
    name: 'gif-export-writer',
    configResolved(config) {
      projectRoot = config.root;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleGifExportRequest(req, res, projectRoot)
          .then((handled) => {
            if (!handled) {
              next();
            }
          })
          .catch((error) => {
            console.error('GIF export middleware crashed', error);
            res.statusCode = 500;
            res.end('Failed to handle GIF export');
          });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleGifExportRequest(req, res, projectRoot)
          .then((handled) => {
            if (!handled) {
              next();
            }
          })
          .catch((error) => {
            console.error('GIF export middleware crashed', error);
            res.statusCode = 500;
            res.end('Failed to handle GIF export');
          });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gifExportPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
