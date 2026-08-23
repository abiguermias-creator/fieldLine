import multer from "multer";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const workOrderPhotoUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_PHOTO_SIZE,
    files: 1,
  },

  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(
        new Error(
          "Only image files are allowed",
        ),
      );
    }

    cb(null, true);
  },
});