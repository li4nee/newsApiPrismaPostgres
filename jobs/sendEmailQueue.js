import { Queue, Worker } from "bullmq";
import client from "../db/redis.config.js";
import logger from "../utils/logger.js";
import sendMail from "../utils/sendEmail.js";
//queue ko kam chai instance banayera redis ma entry hanne
//worker ko kam chai kam gareune redis ma bhako

export const emailJobName = "emailQueue";
export const emailQueue = new Queue(emailJobName, {
  connection: client,
  defaultJobOptions: {
    attempts: 3, // Number of times a job should be retried if it fails.

    // Define a backoff strategy for retrying failed jobs.
    backoff: {
      type: "fixed",
      delay: 10000, // Retry delay in milliseconds
    },
    removeOnComplete: true,
    // removeOnFail: {
    //     count:100,
    //     age:60*60*24 // fail bhaye 24 ghanta samma bascha redis mai
    // },
    removeOnFail: true,
  },
  // Control the rate at which jobs are processed.
  limiter: {
    max: 100, // Maximum number of jobs to process per interval
    duration: 60000, // Interval in milliseconds
  },
  settings: {
    stalledInterval: 30000, // Time interval to check for stalled jobs
    maxStalledCount: 3, // Maximum number of times a job can be stalled
  },
});

//Workers
export const emailHandler = new Worker(
  emailJobName,
  async (job) => {
    try {
      job.data?.map(async (item) => {
        await sendMail(item.toEmail, item.subject, item.body);
      });
      console.log("Processing email job with data:", job.data);
      logger.info(`Processing email job with data:${job.data}`);
    } catch (error) {
      logger.error("Error processing email job:", error?.message);
      console.log(error); // Rethrow error to ensure it’s handled as a failed job
    }
  },
  { connection: client }
);

// worker listeners

emailHandler.on("completed", (job) => {
  logger.info(`sendEmail job of id: ${job.id} is completed`);
  console.log(`sendEmail job of id: ${job.id} is completed`);
});

emailHandler.on("failed", (job) => {
  logger.error(`sendEmail job of id: ${job.id} has failed`);
  console.log(`sendEmail job of id: ${job.id} has failed`);
});
