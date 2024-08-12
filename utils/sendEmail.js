import nodemailer from "nodemailer";
import logger from "./logger.js";

const sendMail = async ( toEmail, subject, body) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: toEmail,
    subject: subject,
    html: body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logger.error(error);
      console.error("Error sending email: ", error);
    } else {
      logger.info(info.response);
      console.log("Email sent: ", info.response);
    }
  });
};

export default sendMail;
