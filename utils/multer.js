// multer.js
import multer from "multer";

const storage = multer.memoryStorage();
const limits = {
  fileSize: 5 * 1024 * 1024, 
};
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    req.fileValidationError = "Invalid file type. Only images are allowed.";
    cb(null, false); 
  }
};

const upload = multer({ storage, fileFilter, limits });

export { upload };
