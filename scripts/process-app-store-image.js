/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Targets per App Store requirements (portrait + landscape)
const TARGETS = {
  iphone: [
    { name: '1284x2778', width: 1284, height: 2778 },
    { name: '2778x1284', width: 2778, height: 1284 },
  ],
  ipad: [
    { name: '2048x2732', width: 2048, height: 2732 },
    { name: '2732x2048', width: 2732, height: 2048 },
  ],
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { bg: process.env.IMG_BG || '#0b1220', in: '', outDir: '' };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if ((a === '--in' || a === '-i') && args[i + 1]) out.in = args[i + 1];
    if ((a === '--bg' || a === '-b') && args[i + 1]) out.bg = args[i + 1];
    if ((a === '--out' || a === '-o') && args[i + 1]) out.outDir = args[i + 1];
  }
  if (!out.in) {
    console.error('Usage: node scripts/process-app-store-image.js --in <path/to/image> [--bg "#000000"] [--out <output/dir>]');
    process.exit(1);
  }
  if (!out.outDir) out.outDir = path.join(process.cwd(), 'app-store-assets', 'manual');
  return out;
}

async function generateForTarget(inputPath, outputDir, target, bg) {
  const base = path.parse(inputPath).name;
  const outName = `${base}-${target.name}.png`;
  const outPath = path.join(outputDir, outName);

  await sharp(inputPath)
    .resize({
      width: target.width,
      height: target.height,
      fit: 'contain', // preserve aspect, pad as needed
      background: bg,
      withoutEnlargement: false,
    })
    .png({ quality: 100 })
    .toFile(outPath);

  console.log(`📸 Saved: ${path.relative(process.cwd(), outPath)}`);
}

(async () => {
  const { in: inputPath, bg, outDir } = parseArgs();
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input path does not exist:', inputPath);
    process.exit(1);
  }

  const iphoneOut = path.join(outDir, 'iphone');
  const ipadOut = path.join(outDir, 'ipad');
  ensureDir(iphoneOut);
  ensureDir(ipadOut);

  const isDir = fs.statSync(inputPath).isDirectory();
  const inputs = [];
  if (isDir) {
    // Collect image files inside the directory (non-recursive)
    const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
    for (const name of fs.readdirSync(inputPath)) {
      const ext = path.extname(name).toLowerCase();
      if (!exts.has(ext)) continue;
      // Skip files that already look processed: *-<WxH>.png
      if (/-(\d{3,4}x\d{3,4})\.png$/i.test(name)) continue;
      inputs.push(path.join(inputPath, name));
    }
  } else {
    inputs.push(inputPath);
  }

  if (inputs.length === 0) {
    console.log('ℹ️ No input images found to process.');
    process.exit(0);
  }

  console.log('▶ Processing images for App Store sizes');
  console.log('   Count:', inputs.length);
  console.log('   Background:', bg);
  console.log('   Output base:', path.relative(process.cwd(), outDir));

  for (const img of inputs) {
    console.log(`\n— Source: ${path.relative(process.cwd(), img)}`);
    // iPhone
    for (const t of TARGETS.iphone) {
      await generateForTarget(img, iphoneOut, t, bg);
    }
    // iPad
    for (const t of TARGETS.ipad) {
      await generateForTarget(img, ipadOut, t, bg);
    }
  }

  console.log('\n✅ Finished processing images for iPhone and iPad sizes.');
})();
