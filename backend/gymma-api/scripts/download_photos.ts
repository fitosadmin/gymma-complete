import fs from 'fs';
import path from 'path';

const GYMS_FILE = path.join(__dirname, '../../../gyms.json');
const OUT_DIR = path.join(__dirname, '../../../../frontend/gymma/public/images/gyms');

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function downloadImage(url: string, dest: string): Promise<boolean> {
  if (fs.existsSync(dest)) {
    return true; // Already downloaded
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.statusText}`);
      return false;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return true;
  } catch (err) {
    console.error(`Error downloading:`, err.message);
    return false;
  }
}

async function run() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const data = JSON.parse(fs.readFileSync(GYMS_FILE, 'utf-8'));
  console.log(`Loaded ${data.length} gyms. Starting download...`);

  let totalDownloaded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process in batches of 10 gyms
  const batchSize = 10;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const promises = batch.map(async (place: any) => {
      const slug = toSlug(place.name);
      
      if (!place.photos || place.photos.length === 0) return;

      const numPhotos = Math.min(place.photos.length, 5);
      for (let p = 0; p < numPhotos; p++) {
        const photo = place.photos[p];
        const dest = path.join(OUT_DIR, `${slug}_${p}.jpg`);
        
        const success = await downloadImage(photo.url, dest);
        if (success) {
          totalDownloaded++;
        } else {
          totalFailed++;
        }
      }
    });

    await Promise.all(promises);
    console.log(`Processed ${Math.min(i + batchSize, data.length)} / ${data.length} gyms...`);
  }

  console.log('Download complete!');
  console.log(`Total Downloaded (or Existed): ${totalDownloaded}`);
  console.log(`Total Failed: ${totalFailed}`);
}

run().catch(console.error);
