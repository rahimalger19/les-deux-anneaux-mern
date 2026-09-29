import { mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";

export const paymentProofDirectory = path.resolve(
  process.cwd(),
  "private-uploads",
  "payment-proofs"
);

mkdirSync(paymentProofDirectory, { recursive: true });

const extensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, paymentProofDirectory);
  },
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${extensions[file.mimetype]}`);
  },
});

export const proofUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!extensions[file.mimetype]) {
      callback(new Error("Only JPG, PNG and PDF files are allowed"));
      return;
    }

    callback(null, true);
  },
});