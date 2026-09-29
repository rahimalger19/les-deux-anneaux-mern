import { mkdirSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";
import multer from "multer";

const galleryDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "gallery"
);

mkdirSync(galleryDirectory, { recursive: true });

const extensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, galleryDirectory);
  },
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${extensions[file.mimetype]}`);
  },
});

export const galleryUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 12,
  },
  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      callback(new Error("Only JPG, PNG and WEBP images are allowed"));
      return;
    }

    callback(null, true);
  },
});