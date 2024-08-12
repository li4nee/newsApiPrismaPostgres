import prisma from "../db/db.config.js";
import vine, { errors } from "@vinejs/vine";
import newsSchema from "../vineValidations/newsValidation.js";
import uploadImageToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../utils/cloudinary.js";
import client from "../db/redis.config.js";
import logger from "../utils/logger.js";

export class NewsController {
  static async get(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      if (page <= 0) {
        page = 1;
      }
      if (limit <= 0 && limit > 100) {
        limit = 10;
      }

      const newsCount = await prisma.news.count();
      const totalPages = Math.ceil(newsCount / limit);
      const skip = (page - 1) * limit;

      const fetchedNews = await prisma.news.findMany({
        take: limit,
        skip: skip,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: true,
            },
          },
        },
      });
      return res.status(200).json({
        message: "News Fetched",
        payload: {
          news: fetchedNews,
          pageData: {
            currentPage: page,
            totalPages,
            currentLimit: limit,
          },
        },
      });
    } catch (error) {
      logger.error(error?.message);
      return res.status(500).json({
        error: "Some error occured",
      });
    }
  }
  static async update(req, res) {
    try {
      const id = req.params.id;
      const user = req.user;
      const news = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
      });
      if (user.id != news.user_id) {
        return res.status(400).json({ error: "Unautorized to update" });
      }
      const validator = vine.compile(newsSchema);
      const output = await validator.validate(req.body);

      let updatedNews;
      if (req.file && !req.fileValidationError) {
        const imageUrl = await uploadImageToCloudinary(req.file.buffer);
        updatedNews = await prisma.news.update({
          where: {
            id: Number(id),
          },
          data: {
            title: output.title,
            content: output.content,
            image: imageUrl,
          },
        });
      } else {
        // update news without a profile image
        updatedNews = await prisma.news.update({
          data: output,
          where: {
            id: Number(id),
          },
        });
      }
      await client.set(id + "news", JSON.stringify(updatedNews), "EX", 60 * 60);
      return res.status(200).json({
        message: "News updated successfully.",
        news: updatedNews,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error(error?.message);
        return res.status(400).json({ errors: error.messages });
      } else {
        console.error(error);
        logger.error(error?.message);
        return res.status(500).json({ errors: "Server error." });
      }
    }
  }
  static async show(req, res) {
    const id = req.params.id;

    try {
      // redis ma herne cha ki nai ?
      const cachedData = await client.get(id + "news");
      // cha ? yei bata send
      if (cachedData) {
        return res.status(200).json({
          source: "cache",
          data: JSON.parse(cachedData),
        });
      }

      //chaina ? Fetch from database
      const fetchedNews = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profile: true,
            },
          },
        },
      });
      // db ma ni chaina ? bad req
      if (!fetchedNews) {
        return res.status(404).json({
          error: "News not found",
        });
      }
      // db ma cha ? redis ma haldine. expiry 1 ghanta
      await client.set(id + "news", JSON.stringify(fetchedNews), "EX", 3600);

      return res.status(200).json({
        message: "News Fetched",
        source: "Database",
        payload: {
          news: fetchedNews,
        },
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      logger.error(error?.message);
      return res.status(500).json({
        error: "An error occurred while fetching the news",
      });
    }
  }

  static async delete(req, res) {
    const id = req.params.id;

    try {
      const newsItem = await prisma.news.findUnique({
        where: {
          id: Number(id),
        },
      });

      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      if (newsItem.user_id != req.user.id) {
        return res.status(400).json({ message: "Not authorized to delete" });
      }
      // Clean from redis
      await client.del(id + "news");
      // Delete the news item from the database
      await prisma.news.delete({
        where: {
          id: Number(id),
        },
      });

      // Extract the public ID from the image URL .
      const publicId = newsItem.image.split("/").pop().split(".")[0];

      // Delete the image from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== "ok") {
        return res
          .status(500)
          .json({ message: "Failed to delete image from Cloudinary" });
      }

      res
        .status(200)
        .json({ message: "News item and image deleted successfully" });
    } catch (error) {
      console.error("Error deleting news item or image:", error);
      logger.error(error?.message);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
  static async create(req, res) {
    const userId = req.user.id;
    try {
      const body = req.body;
      const validator = vine.compile(newsSchema);
      const output = await validator.validate(body);
      if (!req.file || Object.keys(req.file).length == 0) {
        return res.status(400).json({ error: "No image file uploaded." });
      }
      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }
      const imageUrl = await uploadImageToCloudinary(req.file.buffer);
      const createdNews = await prisma.news.create({
        data: {
          title: output.title,
          content: output.content,
          user_id: Number(userId),
          image: imageUrl,
        },
      });
      await client.set(
        createdNews.id + "news",
        JSON.stringify(createdNews),
        "EX",
        60 * 60
      );

      return res.json({
        message: "News Created",
        payload: createdNews,
      });
    } catch (error) {
      if (error instanceof errors.E_VALIDATION_ERROR) {
        logger.error(error?.message);
        res.status(400).json({ errors: error.messages });
      } else {
        console.log(error);
        logger.error(error?.message);
        res.status(500).json({ errors: "Server Error" });
      }
    }
  }
}
