import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const GIF_EXPORT_ROUTE = "/api/export-gif";
const GIF_EXPORT_CONTENT_TYPE = "application/json";

function sanitizeSlug(value: string | null) {
  if (!value) return null;
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || null;
}

async function collectRequestBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", (error) => reject(error));
  });
}

async function writeGifToDisk(root: string, slug: string, contents: Buffer) {
  const directory = resolve(root, "..", "assets", "images", "thumbnails");
  await mkdir(directory, { recursive: true });
  const fileName = `${slug}.gif`;
  const filePath = resolve(directory, fileName);
  await writeFile(filePath, contents);
  return {
    filePath,
    publicPath: `/api/iiif/${fileName}`,
    fileName,
  };
}

async function handleGifExportRequest(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<boolean> {
  if (!req.url || req.method !== "POST") {
    return false;
  }
  const url = new URL(req.url, "http://localhost");
  if (url.pathname !== GIF_EXPORT_ROUTE) {
    return false;
  }
  const slug = sanitizeSlug(url.searchParams.get("slug"));
  if (!slug) {
    res.statusCode = 400;
    res.end("Missing or invalid slug");
    return true;
  }
  try {
    const body = await collectRequestBody(req);
    if (!body.length) {
      res.statusCode = 400;
      res.end("Empty GIF payload");
      return true;
    }
    const { filePath, publicPath, fileName } = await writeGifToDisk(root, slug, body);
    res.statusCode = 201;
    res.setHeader("Content-Type", GIF_EXPORT_CONTENT_TYPE);
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
    console.error("Failed to persist GIF export", error);
    res.statusCode = 500;
    res.end("Failed to write GIF to disk");
    return true;
  }
}

const MANIFEST_EXPORT_ROUTE = "/api/iiif/manifest";
const MANIFEST_SERVE_PREFIX = "/api/iiif/";
const COLLECTION_FILENAME = "collection.json";
const CANOPY_BASE_URL = "http://localhost:5001";
const IIIF_BASE_URL = "https://nulib-ds.github.io/muybridge/iiif";

async function writeManifestToDisk(root: string, slug: string, contents: string) {
  const directory = resolve(root, "..", "assets", "iiif");
  await mkdir(directory, { recursive: true });
  const fileName = `${slug}.json`;
  const filePath = resolve(directory, fileName);
  await writeFile(filePath, contents, "utf-8");
  return {
    filePath,
    publicPath: `/api/iiif/${fileName}`,
    fileName,
  };
}

interface CollectionItem {
  id: string;
  type: "Manifest";
  label: Record<string, string[]>;
  thumbnail?: Array<{ id: string; type: string; format: string }>;
}

function plateNumberFromFilename(filename: string): number {
  const match = filename.match(/^plate-number-(\d+)-/);
  return match ? parseInt(match[1], 10) : Infinity;
}

async function rebuildCollection(root: string): Promise<void> {
  const directory = resolve(root, "..", "assets", "iiif");
  const files = await readdir(directory).catch(() => [] as string[]);
  const manifestFiles = files.filter((f) => f.endsWith(".json") && f !== COLLECTION_FILENAME);

  const items: Array<CollectionItem & { _plateNumber: number }> = [];
  for (const file of manifestFiles) {
    const filePath = resolve(directory, file);
    try {
      const content = await readFile(filePath, "utf-8");
      const manifest = JSON.parse(content) as Record<string, unknown>;
      if (manifest.type !== "Manifest") continue;
      const item: CollectionItem & { _plateNumber: number } = {
        id: `${IIIF_BASE_URL}/${file}`,
        type: "Manifest",
        label: (manifest.label as Record<string, string[]>) ?? { en: [file.replace(".json", "")] },
        _plateNumber: plateNumberFromFilename(file),
      };
      if (Array.isArray(manifest.thumbnail) && manifest.thumbnail.length > 0) {
        item.thumbnail = manifest.thumbnail as CollectionItem["thumbnail"];
      }
      items.push(item);
    } catch {
      // skip unreadable / malformed files
    }
  }

  items.sort((a, b) => a._plateNumber - b._plateNumber);

  const collectionItems: CollectionItem[] = items.map(({ _plateNumber: _, ...item }) => item);

  const collection = {
    "@context": "https://iiif.io/api/presentation/3/context.json",
    id: `${IIIF_BASE_URL}/${COLLECTION_FILENAME}`,
    type: "Collection",
    label: { en: ["Muybridge Animal Locomotion"] },
    items: collectionItems,
  };

  const collectionPath = resolve(directory, COLLECTION_FILENAME);
  await writeFile(collectionPath, JSON.stringify(collection, null, 2), "utf-8");
}

async function handleManifestRequest(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<boolean> {
  if (!req.url) return false;
  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === MANIFEST_EXPORT_ROUTE) {
    const slug = sanitizeSlug(url.searchParams.get("slug"));
    if (!slug) {
      res.statusCode = 400;
      res.end("Missing or invalid slug");
      return true;
    }
    try {
      const body = await collectRequestBody(req);
      if (!body.length) {
        res.statusCode = 400;
        res.end("Empty manifest payload");
        return true;
      }
      const { filePath, publicPath, fileName } = await writeManifestToDisk(
        root,
        slug,
        body.toString("utf-8"),
      );
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, filePath, fileName, publicPath }));
      // Rebuild collection after response is sent — non-blocking for the client.
      rebuildCollection(root).catch((error) => {
        console.error("Failed to rebuild IIIF collection", error);
      });
      return true;
    } catch (error) {
      console.error("Failed to persist manifest", error);
      res.statusCode = 500;
      res.end("Failed to write manifest to disk");
      return true;
    }
  }

  if (req.method === "GET" && url.pathname.startsWith(MANIFEST_SERVE_PREFIX)) {
    const filename = url.pathname.slice(MANIFEST_SERVE_PREFIX.length);
    if (filename.includes("/") || filename.includes("..")) return false;
    const isJson = filename.endsWith(".json");
    const isGif = filename.endsWith(".gif");
    if (!isJson && !isGif) return false;
    const filePath = isJson
      ? resolve(root, "..", "assets", "iiif", filename)
      : resolve(root, "..", "assets", "images", "thumbnails", filename);
    try {
      const contents = isJson ? await readFile(filePath, "utf-8") : await readFile(filePath);
      res.statusCode = 200;
      res.setHeader("Content-Type", isJson ? "application/json" : "image/gif");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(contents);
      return true;
    } catch {
      res.statusCode = 404;
      res.end("Not found");
      return true;
    }
  }

  return false;
}

function manifestExportPlugin(): Plugin {
  let projectRoot = process.cwd();
  return {
    name: "manifest-export-writer",
    configResolved(config) {
      projectRoot = config.root;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleManifestRequest(req, res, projectRoot)
          .then((handled) => {
            if (!handled) next();
          })
          .catch((error) => {
            console.error("Manifest middleware crashed", error);
            res.statusCode = 500;
            res.end("Failed to handle manifest request");
          });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleManifestRequest(req, res, projectRoot)
          .then((handled) => {
            if (!handled) next();
          })
          .catch((error) => {
            console.error("Manifest middleware crashed", error);
            res.statusCode = 500;
            res.end("Failed to handle manifest request");
          });
      });
    },
  };
}

function gifExportPlugin(): Plugin {
  let projectRoot = process.cwd();
  return {
    name: "gif-export-writer",
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
            console.error("GIF export middleware crashed", error);
            res.statusCode = 500;
            res.end("Failed to handle GIF export");
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
            console.error("GIF export middleware crashed", error);
            res.statusCode = 500;
            res.end("Failed to handle GIF export");
          });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gifExportPlugin(), manifestExportPlugin()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
