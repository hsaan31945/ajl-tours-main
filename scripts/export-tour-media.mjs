import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const workspaceRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultInput = path.join(
  workspaceRoot,
  "database-backups/db_export_20260519_001437/tours.json",
);
const inputPath = path.resolve(process.argv[2] || defaultInput);
const mediaRoot = path.join(workspaceRoot, "frontend/public/tour-media");
const manifestPath = path.join(workspaceRoot, "backend/data/tour-media-manifest.json");

const extensionByMime = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const parseDataImage = (value) => {
  const match = String(value || "").match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const extension = extensionByMime[mime];
  if (!extension) return null;
  return {
    extension,
    buffer: Buffer.from(match[2], "base64"),
  };
};

const raw = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const parsed = JSON.parse(raw);
const tours = Array.isArray(parsed) ? parsed : parsed.value || [];
const manifest = {};
let exportedBytes = 0;
let exportedImages = 0;

fs.mkdirSync(mediaRoot, { recursive: true });

for (const tour of tours) {
  const tourId = String(tour?._id || tour?.id || "").trim();
  if (!tourId) continue;

  const sourceImages = Array.isArray(tour.images) ? tour.images : [];
  const urls = [];

  sourceImages.forEach((image, index) => {
    if (typeof image === "string" && /^(https?:\/\/|\/)/i.test(image) && !/^data:/i.test(image)) {
      urls.push(image);
      return;
    }

    const parsedImage = parseDataImage(image);
    if (!parsedImage) return;

    const directory = path.join(mediaRoot, tourId);
    const filename = `${index}.${parsedImage.extension}`;
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, filename), parsedImage.buffer);
    urls.push(`/tour-media/${tourId}/${filename}`);
    exportedBytes += parsedImage.buffer.length;
    exportedImages += 1;
  });

  if (urls.length) manifest[tourId] = urls;
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({
  inputPath,
  tours: tours.length,
  exportedImages,
  exportedBytes,
  manifestPath,
  mediaRoot,
}));
