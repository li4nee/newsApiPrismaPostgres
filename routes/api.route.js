import { Router } from "express";
import AuthController from "../controlllers/AuthController.js";
import ProfileController from "../controlllers/ProfileController.js";
import authMiddleware from "../Middleware/authenticate.js";
import { NewsController } from "../controlllers/NewsController.js";
import { upload } from "../utils/multer.js";
const router = Router();

router.post("/auth/register", upload.single("image"), AuthController.register);
router.post("/auth/login", AuthController.login);
router.get("/auth/sendOtp", AuthController.sendOTP);
router.post("/auth/checkOtp", AuthController.checkOTP);

// PRIVATE ROUTES FOR PROFILE
router.get("/profile", authMiddleware, ProfileController.get);
router.put(
  "/profile",
  authMiddleware,
  upload.single("image"),
  ProfileController.updateImage
);

//NEWS ROUTES
router.get("/news", authMiddleware, NewsController.get);
router.get("/news/:id", authMiddleware, NewsController.show);
router.post(
  "/news",
  authMiddleware,
  upload.single("image"),
  NewsController.create
);
router.delete("/news/:id", authMiddleware, NewsController.delete);
router.put(
  "/news/:id",
  authMiddleware,
  upload.single("image"),
  NewsController.update
);
export default router;
