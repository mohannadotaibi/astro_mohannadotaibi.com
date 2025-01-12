import https from "https";
import axios from "axios";
import fsPromisified from "fs/promises";
import fs from "fs";
import path from "path";
import icojs from 'icojs';
import sharp from 'sharp';

// Configuration
const CONFIG = {
  ICON_SIZE: 64,
  CACHE_DIR: "public/assets/images/icons",
  DUMMY_ICON: "public/assets/images/icons/generic.png",
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  PARALLEL_LIMIT: 3
};

// Favicon sources with placeholders for domain
const FAVICON_SOURCES = [
  {
    url: "https://www.google.com/s2/favicons?sz=64&domain_url=",
    appendDomain: true,
    appendProtocol: true
  },
  {
    url: "https://api.faviconkit.com/",
    appendDomain: true,
    appendProtocol: false
  },
  {
    url: "https://favicongrabber.com/api/grab/",
    appendDomain: true,
    appendProtocol: false
  },
  {
    url: "https://favicon.mohannad-otaibi.workers.dev/convert?format=png&url=",
    appendDomain: true,
    appendProtocol: true
  }
];

// Axios instance with configuration
const axiosInstance = axios.create({
  maxRedirects: 35,
  timeout: 5000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// URL validation
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Delay utility for retry mechanism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.MAX_RETRIES,
  initialDelay = CONFIG.RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(initialDelay);
    return withRetry(fn, retries - 1, initialDelay * 2);
  }
}

// Image processing utilities
async function normalizeImage(buffer: Buffer, iconPath: string): Promise<void> {
  await sharp(buffer)
    .resize(CONFIG.ICON_SIZE, CONFIG.ICON_SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(iconPath);
}

async function processIcoFile(buffer: Buffer): Promise<Buffer> {
  const frames = await icojs.parse(buffer);
  const bestFrame = frames.reduce((prev, curr) => 
    (curr.width > prev.width) ? curr : prev
  );
  return await sharp(bestFrame.buffer).png().toBuffer();
}

// Download and process icon
async function downloadIcon(iconUrl: string, iconPath: string): Promise<void> {
  const response = await withRetry(() => 
    axiosInstance.get(iconUrl, { responseType: "arraybuffer" })
  );
  
  const buffer = Buffer.from(response.data);
  
  try {
    if (await icojs.isICO(buffer)) {
      const pngBuffer = await processIcoFile(buffer);
      await normalizeImage(pngBuffer, iconPath);
    } else {
      await normalizeImage(buffer, iconPath);
    }
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

// Try to fetch icon from multiple sources in parallel
async function tryFetchIcon(url: string, iconPath: string): Promise<string> {
  const urlObject = new URL(url);
  const sources = FAVICON_SOURCES.map(source => {
    const domain = source.appendProtocol ? urlObject.origin : urlObject.hostname;
    return source.url + domain;
  });
  
  // Add website's own favicon.ico
  sources.push(`${urlObject.origin}/favicon.ico`);
  
  // Try sources in parallel with a limit
  for (let i = 0; i < sources.length; i += CONFIG.PARALLEL_LIMIT) {
    const batch = sources.slice(i, i + CONFIG.PARALLEL_LIMIT);
    const promises = batch.map(source => 
      downloadIcon(source, iconPath)
        .then(() => true)
        .catch(() => false)
    );
    
    const results = await Promise.all(promises);
    if (results.some(result => result)) {
      return iconPath;
    }
  }
  
  throw new Error("No favicon found from any source");
}

// Main getIcon function
async function getIcon(url: string): Promise<string> {
  // Handle special cases
  if (url === "#" || !isValidUrl(url)) {
    return CONFIG.DUMMY_ICON;
  }

  const urlObject = new URL(url);
  const iconPath = path.join(CONFIG.CACHE_DIR, `${urlObject.hostname}.png`);

  // Return cached icon if exists
  if (fs.existsSync(iconPath)) {
    return iconPath;
  }

  try {
    // Ensure cache directory exists
    await fsPromisified.mkdir(CONFIG.CACHE_DIR, { recursive: true });
    
    // Try to fetch and process icon
    return await tryFetchIcon(url, iconPath);
  } catch (error) {
    console.error("Failed to fetch icon for:", url, error);
    // Copy dummy icon as fallback
    await fsPromisified.copyFile(CONFIG.DUMMY_ICON, iconPath);
    return iconPath;
  }
}

export default getIcon;
