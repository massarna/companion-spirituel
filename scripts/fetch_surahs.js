
const fs = require('node:fs/promises');
const https = require('node:https');
const path = require('node:path');

const SURAHS = [
  { num: 1, slug: 'al-fatiha', name_ar: 'سورة الفاتحة' },
  { num: 18, slug: 'al-kahf', name_ar: 'سورة الكهف' },
  { num: 36, slug: 'yasin', name_ar: 'سورة يس' },
  { num: 44, slug: 'dukhan', name_ar: 'سورة الدخان' },
  { num: 56, slug: 'waqiah', name_ar: 'سورة الواقعة' },
  { num: 67, slug: 'mulk', name_ar: 'سورة الملك' },
  { num: 76, slug: 'insan', name_ar: 'سورة الإنسان' },
  { num: 85, slug: 'buruj', name_ar: 'سورة البروج' }
];

const MANIFEST = {
  "fatiha": { "title": "سورة الفاتحة", "file": "surah-1-al-fatiha.ar.json" },
  "kahf": { "title": "سورة الكهف", "file": "surah-18-al-kahf.ar.json" },
  "yasin": { "title": "سورة يس", "file": "surah-36-yasin.ar.json" },
  "dukhan": { "title": "سورة الدخان", "file": "surah-44-dukhan.ar.json" },
  "waqiah": { "title": "سورة الواقعة", "file": "surah-56-waqiah.ar.json" },
  "mulk": { "title": "سورة الملك", "file": "surah-67-mulk.ar.json" },
  "insan": { "title": "سورة الإنسان", "file": "surah-76-insan.ar.json" },
  "buruj": { "title": "سورة البروج", "file": "surah-85-buruj.ar.json" }
};

const force = process.argv.includes('--force');
const lecturesDir = path.join(process.cwd(), 'data', 'lectures');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function ensureDirectory() {
  try {
    await fs.access(lecturesDir);
  } catch {
    await fs.mkdir(lecturesDir, { recursive: true });
    console.log(`📁 Created directory: ${lecturesDir}`);
  }
}

async function fetchSurah(surahInfo) {
  const fileName = `surah-${surahInfo.num}-${surahInfo.slug}.ar.json`;
  const filePath = path.join(lecturesDir, fileName);

  // Check if file exists and skip if not forcing
  if (!force) {
    try {
      await fs.access(filePath);
      console.log(`⏭️  Skipping ${fileName} (already exists)`);
      return;
    } catch {
      // File doesn't exist, continue
    }
  }

  console.log(`🔄 Fetching Surah ${surahInfo.num} (${surahInfo.name_ar})...`);

  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahInfo.num}/ar.uthmani`;
    const response = await httpsGet(url);

    if (!response.data || !response.data.ayahs) {
      throw new Error('Invalid API response structure');
    }

    const surahData = {
      surah: surahInfo.num,
      name_ar: surahInfo.name_ar,
      ayahs: response.data.ayahs.map(ayah => ({
        n: ayah.numberInSurah,
        ar: ayah.text
      }))
    };

    await fs.writeFile(filePath, JSON.stringify(surahData, null, 2), 'utf8');
    console.log(`✅ Saved ${fileName} (${surahData.ayahs.length} ayahs)`);

  } catch (error) {
    console.error(`❌ Failed to fetch Surah ${surahInfo.num}: ${error.message}`);
    process.exitCode = 1;
  }
}

async function updateManifest() {
  const manifestPath = path.join(lecturesDir, 'manifest.json');
  
  try {
    await fs.writeFile(manifestPath, JSON.stringify(MANIFEST, null, 2), 'utf8');
    console.log('✅ Updated manifest.json');
  } catch (error) {
    console.error(`❌ Failed to update manifest: ${error.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('🚀 Starting Quran surahs fetch...');
  
  await ensureDirectory();
  
  // Fetch all surahs with a small delay between requests
  for (const surah of SURAHS) {
    await fetchSurah(surah);
    // Small delay to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  await updateManifest();
  
  console.log('🎉 Done! All surahs have been processed.');
}

main().catch(console.error);
