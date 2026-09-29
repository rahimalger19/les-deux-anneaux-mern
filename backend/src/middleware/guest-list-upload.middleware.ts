import multer from "multer";

export const guestListUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const acceptedTypes = [
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
    ];

    if (
      !acceptedTypes.includes(file.mimetype) &&
      !file.originalname.toLowerCase().endsWith(".csv")
    ) {
      return callback(new Error("Only CSV files are allowed"));
    }

    callback(null, true);
  },
});