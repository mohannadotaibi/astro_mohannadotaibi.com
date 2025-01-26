import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const POSTERS_DIR = 'public/assets/images/games';

async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function downloadImage(url: string, filepath: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    await fs.writeFile(filepath, new Uint8Array(arrayBuffer));
    return true;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return false;
  }
}

export default async function getGamePoster(url: string, title: string) {
  if (!url) return null;

  await ensureDirectoryExists(POSTERS_DIR);
  
  // Create a safe filename from the title
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const extension = path.extname(url) || '.jpg';
  const filename = `${safeTitle}${extension}`;
  const filepath = path.join(POSTERS_DIR, filename);
  const publicPath = `/assets/images/games/${filename}`;

  try {
    // Check if file exists
    await fs.access(filepath);
    return publicPath;
  } catch {
    // File doesn't exist, download it
    const success = await downloadImage(url, filepath);
    return success ? publicPath : null;
  }
} 