import fs from 'fs';
import path from 'path';

/**
 * Hybrid data store: Vercel Blob in production, local filesystem in dev.
 * Reads from Blob first (if available), falls back to local JSON files.
 * Writes go to Blob in production, local files in dev.
 */

const BLOB_DATA_PREFIX = 'data';

// Cache blob URLs after writing so we can read them back without list()
const blobUrlCache: Record<string, string> = {};

async function blobPut(filename: string, data: string): Promise<void> {
  const { put } = await import('@vercel/blob');
  const key = `${BLOB_DATA_PREFIX}/${filename}`;
  const blob = await put(key, data, {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
  blobUrlCache[filename] = blob.url;
}

async function blobGet(filename: string): Promise<string | null> {
  try {
    // If we have a cached URL from a previous write, use it directly
    if (blobUrlCache[filename]) {
      const bustUrl = `${blobUrlCache[filename]}?t=${Date.now()}`;
      const res = await fetch(bustUrl, { cache: 'no-store' });
      if (res.ok) return await res.text();
    }

    // Otherwise, list blobs to find the URL
    const { list } = await import('@vercel/blob');
    const key = `${BLOB_DATA_PREFIX}/${filename}`;
    const result = await list({ prefix: key, limit: 10 });
    const match = result.blobs.find((b) => b.pathname === key);
    if (!match) return null;

    blobUrlCache[filename] = match.url;
    const bustUrl = `${match.url}?t=${Date.now()}`;
    const res = await fetch(bustUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`blobGet(${filename}) error:`, err);
    return null;
  }
}

function localPath(filename: string): string {
  return path.join(process.cwd(), 'data', filename);
}

function localRead(filename: string): string {
  return fs.readFileSync(localPath(filename), 'utf-8');
}

function localWrite(filename: string, data: string): void {
  fs.writeFileSync(localPath(filename), data);
}

export async function readData<T>(filename: string): Promise<T> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobData = await blobGet(filename);
    if (blobData) return JSON.parse(blobData) as T;
  }
  // Fall back to local file (seed data)
  return JSON.parse(localRead(filename)) as T;
}

export async function writeData<T>(filename: string, data: T): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await blobPut(filename, json);
  } else {
    localWrite(filename, json);
  }
}
