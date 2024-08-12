import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          console.error("Error uploading image to Cloudinary:", error);
          return reject("An error occurred while uploading the image.");
        }
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export default uploadImageToCloudinary;
