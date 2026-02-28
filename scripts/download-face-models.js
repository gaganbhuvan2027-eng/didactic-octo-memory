const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const modelFiles = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = MODEL_BASE_URL + filename;
    const filepath = path.join(MODELS_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`✓ ${filename} already exists`);
      resolve();
      return;
    }

    console.log(`Downloading ${filename}...`);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✓ Downloaded ${filename}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllModels() {
  console.log('Downloading face-api.js models...\n');
  
  try {
    for (const file of modelFiles) {
      await downloadFile(file);
    }
    console.log('\n✓ All models downloaded successfully!');
  } catch (error) {
    console.error('\n✗ Error downloading models:', error.message);
    process.exit(1);
  }
}

downloadAllModels();

