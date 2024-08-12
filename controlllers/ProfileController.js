import prisma from "../db/db.config.js";
import uploadImageToCloudinary from "../utils/uploadToCloudinary.js";
import {
  loginSchema,
  updateSchema,
} from "../vineValidations/authValidation.js";
import vine, { errors } from "@vinejs/vine";
import client from "../db/redis.config.js";

class ProfileController {
  static async get(req, res) {
    try {
      const user = req.user;
      return res.status(200).json({ user });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      logger.error(error?.message);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching the profile." });
    }
  }

  static async updateImage(req, res) {
    try {
      const userId = req.user.id;

      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
      }

      // Check for file validation errors
      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }

      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(req.file.buffer);

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profile: imageUrl },
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }

      const { password, ...noPassUpdatedUser } = updatedUser;
      res.status(200).json({
        message: "Profile image updated successfully.",
        user: noPassUpdatedUser,
      });
    } catch (error) {
      console.log("Error updating profile image:", error);
      logger.error(error?.message);
      return res
        .status(500)
        .json({ error: "An error occurred while updating the profile image." });
    }
  }

  static async update() {
    try {
      const userId = req.user.id;

      // Validate input
      const body = req.body;
      const validator = vine.compile(updateSchema);
      const output = await validator.validate(body);

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: output.name,
          email: output.email,
        },
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }

      const { password, ...noPassUpdatedUser } = updatedUser;
      return res.status(200).json({
        message: "Profile updated successfully.",
        user: noPassUpdatedUser,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error(error?.message);
        return res.status(400).json({ errors: error.messages });
      } else {
        console.log(error);
        logger.error(error?.message);
        return res.status(500).json({ errors: "Server Error" });
      }
    }
  }

  static async show(req, res) {
    try {
      const userId = Number(req.params.id);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const { password, ...noPassUser } = user;
      res.status(200).json({
        message: "User Fetched Sucessfully",
        user: noPassUser,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      logger.error(error?.message);
      return res
        .status(500)
        .json({ error: "An error occurred while fetching the user profile." });
    }
  }

  static async delete(req, res) {
    try {
      const user = req.user;
      const userId = req.user.id;

      // Check if the profile image is 'zxvexbvgumne6xn1u0db'
      const profilePublicId = user.profile
        ? user.profile.split("/").pop().split(".")[0]
        : null;

      // Delete the user's profile image from Cloudinary if it exists
      if (profilePublicId && profilePublicId !== "zxvexbvgumne6xn1u0db") {
        await cloudinary.uploader.destroy(profilePublicId);
      }

      // Delete the user from the database
      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(200).json({ message: "User profile deleted successfully." });
    } catch (error) {
      console.error("Error deleting user profile:", error);
      logger.error(error?.message);
      return res
        .status(500)
        .json({ error: "An error occurred while deleting the profile." });
    }
  }
}

export default ProfileController;
