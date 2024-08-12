import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.route.js";
import helmet from "helmet";
import cors from "cors";
import limiter from "./Middleware/rateLimit.js";
import logger from "./utils/logger.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.listen(PORT, (err) => {
  if (!err) {
    logger.info(`Port running on port : ${PORT} `);
    console.log("Port running on port : ", PORT);
  } else {
    logger.error(err);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(helmet());
app.use(limiter);
app.use("/api", apiRoutes);

// jobs import
import "./jobs/index.jobs.js";
