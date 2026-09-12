import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "native-assets", "app-icon.png");

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function writePng(size, target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await sharp(source)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(target);
}

async function applyAndroidIcons() {
  const res = path.join(root, "android", "app", "src", "main", "res");
  if (!(await exists(res))) return false;

  const sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
  };

  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(res, folder);
    await writePng(size, path.join(dir, "ic_launcher.png"));
    await writePng(size, path.join(dir, "ic_launcher_round.png"));
  }

  // Capacitor creates adaptive-icon XML resources that would otherwise take
  // precedence over the PNG launcher icons on newer Android versions.
  const adaptiveDir = path.join(res, "mipmap-anydpi-v26");
  for (const file of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
    await fs.rm(path.join(adaptiveDir, file), { force: true });
  }

  console.log("Applied Connection Card launcher icon to Android project.");
  return true;
}

async function applyIosIcons() {
  const target = path.join(
    root,
    "ios",
    "App",
    "App",
    "Assets.xcassets",
    "AppIcon.appiconset"
  );

  const assetsRoot = path.join(root, "ios", "App", "App", "Assets.xcassets");
  if (!(await exists(assetsRoot))) return false;

  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });

  const icons = [
    ["Icon-App-20x20@2x.png", 40, "20x20", "2x", "iphone"],
    ["Icon-App-20x20@3x.png", 60, "20x20", "3x", "iphone"],
    ["Icon-App-29x29@2x.png", 58, "29x29", "2x", "iphone"],
    ["Icon-App-29x29@3x.png", 87, "29x29", "3x", "iphone"],
    ["Icon-App-40x40@2x.png", 80, "40x40", "2x", "iphone"],
    ["Icon-App-40x40@3x.png", 120, "40x40", "3x", "iphone"],
    ["Icon-App-60x60@2x.png", 120, "60x60", "2x", "iphone"],
    ["Icon-App-60x60@3x.png", 180, "60x60", "3x", "iphone"],
    ["Icon-App-20x20@1x-ipad.png", 20, "20x20", "1x", "ipad"],
    ["Icon-App-20x20@2x-ipad.png", 40, "20x20", "2x", "ipad"],
    ["Icon-App-29x29@1x-ipad.png", 29, "29x29", "1x", "ipad"],
    ["Icon-App-29x29@2x-ipad.png", 58, "29x29", "2x", "ipad"],
    ["Icon-App-40x40@1x-ipad.png", 40, "40x40", "1x", "ipad"],
    ["Icon-App-40x40@2x-ipad.png", 80, "40x40", "2x", "ipad"],
    ["Icon-App-76x76@1x.png", 76, "76x76", "1x", "ipad"],
    ["Icon-App-76x76@2x.png", 152, "76x76", "2x", "ipad"],
    ["Icon-App-83.5x83.5@2x.png", 167, "83.5x83.5", "2x", "ipad"],
    ["Icon-App-1024x1024@1x.png", 1024, "1024x1024", "1x", "ios-marketing"]
  ];

  const images = [];
  for (const [filename, pixels, size, scale, idiom] of icons) {
    await writePng(pixels, path.join(target, filename));
    images.push({ size, idiom, filename, scale });
  }

  await fs.writeFile(
    path.join(target, "Contents.json"),
    JSON.stringify({ images, info: { version: 1, author: "xcode" } }, null, 2) + "\n"
  );

  console.log("Applied Connection Card AppIcon set to iOS project.");
  return true;
}

if (!(await exists(source))) {
  throw new Error(`Missing app icon source: ${source}`);
}

const android = await applyAndroidIcons();
const ios = await applyIosIcons();

if (!android && !ios) {
  console.log("No native platform project exists yet; icon source is ready for the next native build.");
}
