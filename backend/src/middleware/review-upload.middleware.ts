import fs from "fs";
import path from "path";
import multer from "multer";

const reviewUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "reviews"
);

fs.mkdirSync(reviewUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, reviewUploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`;

    callback(null, name);
  },
});

export const reviewUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return callback(new Error("Only JPG and PNG photos are allowed"));
    }

    callback(null, true);
  },
});