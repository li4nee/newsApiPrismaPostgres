import prisma from "../db/db.config.js";
import vine, { errors } from "@vinejs/vine";
import {
  registrationSchema,
  loginSchema,
} from "../vineValidations/authValidation.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uploadImageToCloudinary from "../utils/uploadToCloudinary.js";
import logger from "../utils/logger.js";
import sendMail from "../utils/sendEmail.js";
import generateOtp from "../utils/generateOtp.js";
import { emailJobName, emailQueue } from "../jobs/sendEmailQueue.js";

class AuthController {
  static async register(req, res) {
    try {
      const body = req.body;

      // Validate the user input
      const validator = vine.compile(registrationSchema);
      const output = await validator.validate(body);

      // Hash the user's password
      output.password = bcrypt.hashSync(body.password, 10);

      // Check if the user already exists
      const previousUser = await prisma.user.findUnique({
        where: { email: output.email },
      });

      if (previousUser) {
        return res.status(400).json({
          errors: {
            email: "This email has already been used. Choose another email.",
          },
        });
      }

      // Check if a profile image is provided
      let user;
      if (req.file && !req.fileValidationError) {
        const imageUrl = await uploadImageToCloudinary(req.file.buffer);
        user = await prisma.user.create({
          data: {
            name: output.name,
            email: output.email,
            password: output.password,
            profile: imageUrl,
          },
        });
      } else {
        // Create the user without a profile image
        user = await prisma.user.create({
          data: output,
        });
      }

      // Remove the password from the user object before sending the response
      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        message: "User created successfully.",
        user: userWithoutPassword,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        return res.status(400).json({ errors: error.messages });
      } else {
        logger.error(error?.message);
        console.log(error);
        return res.status(500).json({ errors: "Server error." });
      }
    }
  }
  static async login(req, res) {
    try {
      const body = req.body;
      // VALIDATE LOGIN

      const validator = vine.compile(loginSchema);
      const output = await validator.validate(body);

      //CHECK IF PREVIOUS USER THERE

      const previousUser = await prisma.user.findUnique({
        where: {
          email: output.email,
        },
      });

      //IF NOT RETURN
      if (!previousUser) {
        return res.status(400).json({
          errors: {
            email: "User not found.Please register.",
          },
        });
      }

      // PASSWORD CHECK
      if (!bcrypt.compareSync(output.password, previousUser.password)) {
        return res.status(400).json({
          errors: {
            password: "Invalid password",
          },
        });
      }
      const { password, ...userWithOutPassword } = previousUser;

      //ASSIGN JWT

      const token = jwt.sign(
        {
          data: userWithOutPassword,
        },
        process.env.JWT_SECRET,
        { expiresIn: "3h" }
      );

      return res.status(200).json({
        message: "User Logged In",
        user: userWithOutPassword,
        token: `Bearer ${token}`,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        res.status(400).json({ errors: error.messages });
      } else {
        console.log(error);
        logger.error(error?.message);
        res.status(500).json({ errors: "Server Error" });
      }
    }
  }
  static async sendOTP(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const isEmailThere = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (!isEmailThere) {
        return res.status(400).json({ error: "Email not registered" });
      }
      const otp = generateOtp();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      const payload = [
        {
          toEmail: email,
          subject: "Your OTP Code",
          body: `<h1>Your OTP Code</h1>
               <p>Your OTP code is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
        },
      ];
      await emailQueue.add(emailJobName, payload);

      await prisma.user.update({
        where: { email: email },
        data: {
          otp,
          otpExpires,
        },
      });
      return res.status(200).json({ message: "Job added to send otp." });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).json({ error: "SOmething went wrong" });
    }
  }
  static async checkOTP(req, res) {
    try {
      const { otp } = req.body;
      const { email } = req.query;
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      const user = await prisma.user.findUnique({
        where: { email: email },
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // otp thik cha ki nai check hanne
      if (user.otp === otp && new Date() < user.otpExpires) {
        //sakke pachi faldine sab lai ani user lai validate hanne
        await prisma.user.update({
          where: { email: email },
          data: {
            isValidated: true,
            otp: null,
            otpExpires: null,
          },
        });
        return res.status(200).json({ message: "OTP verified successfully" });
      } else {
        // otp invalid bhaye k garne

        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
    } catch (error) {
      logger.error(error?.message);
      return res.status(500).json({ error: "Something went wrong" });
    }
  }
}

export default AuthController;
