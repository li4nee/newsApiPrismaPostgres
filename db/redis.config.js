import Redis from "ioredis";
import logger from "../utils/logger.js";

// Create a Redis client
const client = new Redis({
  maxRetriesPerRequest:null
});

// Handle errors
client.on("error", (err) => {
  console.error("Redis Client Error:", err);
  logger.error("Redis Client Error:", err);
});

export default client;
