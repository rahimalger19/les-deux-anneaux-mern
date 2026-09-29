import fs from "fs";
import path from "path";
import multer from "multer";

const profileUploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "profiles"
);

fs.mkdirSync(profileUploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, profileUploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1_000_000)}${extension}`
    );
  },
});

export const profileUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return callback(new Error("Only JPG and PNG photos are allowed"));
    }

    callback(null, true);
  },
});