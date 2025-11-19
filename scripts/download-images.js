import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '../src/data/standings-cache.json');
const OUTPUT_DIR = path.join(__dirname, '../public/drivers');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read cache file
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

// Extract unique drivers
const drivers = new Map(); // id -> { givenName, familyName }

Object.values(cache).forEach(yearData => {
  if (yearData.driverStandings) {
    Object.values(yearData.driverStandings).forEach(round => {
      if (round.DriverStandings) {
        round.DriverStandings.forEach(standing => {
          const driver = standing.Driver;
          if (!drivers.has(driver.driverId)) {
            drivers.set(driver.driverId, {
              givenName: driver.givenName,
              familyName: driver.familyName,
              id: driver.driverId
            });
          }
        });
      }
    });
  }
});

console.log(`Found ${drivers.size} unique drivers.`);

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        res.resume(); // Consume response data to free up memory
        resolve(false);
      }
    }).on('error', (err) => {
      resolve(false);
    });
  });
};

const processDrivers = async () => {
  let successCount = 0;
  let failCount = 0;

  for (const [id, driver] of drivers) {
    const familyName = driver.familyName.charAt(0).toUpperCase() + driver.familyName.slice(1).toLowerCase();
    const givenName = driver.givenName.charAt(0).toUpperCase() + driver.givenName.slice(1).toLowerCase();
    
    // Try different naming conventions
    const variations = [
      `${givenName}_${familyName}`, // Max_Verstappen
      familyName,                   // Verstappen
      `${givenName}-${familyName}`, // Max-Verstappen
    ];

    // Also try different years if needed
    const years = ['2025', '2024', '2023'];
    
    let downloaded = false;
    const filename = `${givenName}_${familyName}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Skip if already exists (optional, but good for re-runs)
    // if (fs.existsSync(filepath)) {
    //   console.log(`Skipping ${filename} (already exists)`);
    //   continue;
    // }

    console.log(`Attempting to download for ${givenName} ${familyName}...`);

    for (const year of years) {
      if (downloaded) break;
      for (const variation of variations) {
        if (downloaded) break;
        
        const url = `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_1320/content/dam/fom-website/drivers/${year}Drivers/${variation}.png`;
        
        const success = await downloadImage(url, filepath);
        if (success) {
          console.log(`  ✅ Downloaded ${filename} (Source: ${year}/${variation})`);
          downloaded = true;
          successCount++;
        }
      }
    }

    if (!downloaded) {
      console.error(`  ❌ Failed to download image for ${givenName} ${familyName}`);
      failCount++;
    }
    
    // Small delay to be nice to the server
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDownload complete.`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
};

processDrivers();
