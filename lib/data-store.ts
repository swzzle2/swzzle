import fs from 'fs';
import path from 'path';

/**
 * Hybrid data store: Vercel Blob in production, local filesystem in dev.
 * Reads from Blob first (if available), falls back to local JSON files.
 * Writes go to Blob in production, local files in dev.
 */

const BLOB_DATA_PREFIX = 'data';

async function blobPut(filename: string, data: string): Promise<void> {
  const { put } = await import('@vercel/blob');
  await put(`${BLOB_DATA_PREFIX}/${filename}`, data, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

async function blobGet(filename: string): Promise<string | null> {
  try {
    const { list } = await import('@vercel/blob');
    const result = await list({ prefix: `${BLOB_DATA_PREFIX}/${filename}` });
    const match = result.blobs.find((b) => b.pathname === `${BLOB_DATA_PREFIX}/${filename}`);
    if (!match) return null;

    const res = await fetch(match.url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
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
