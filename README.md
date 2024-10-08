## DESCRIPTION
Modern Node.js API with class-based controllers, async operations, and security best practices. Utilizes PostgreSQL, Prisma, Redis, and Cloudinary. Features OTP verification, JWT authentication, rate limiting, and an queue based email sending system via Nodemailer and BullMQ, with Winston logging.

- **Modern Node.js Application:** Utilizes class-based controllers, asynchronous operations, validation, and security practices.
- **Database Management:** Leverages PostgreSQL with Prisma.
- **Caching:** Implements Redis for efficient data caching.
- **Image Storage:** Uses Cloudinary for storing and managing images.
- **Email Handling:** Employs an asynchronous job queue with BullMQ for robust email management with email being sent through NodeMailer.
- **Rate Limiting:** Includes rate limiting to prevent abuse and manage request loads.
- **Security Features For Registration:**
  - **Password Hashing:** Uses bcrypt for secure password hashing.
  - **JWT Authentication:** Implements JWT for secure user authentication.
  - **OTP Verification:** Provides OTP-based verification for user registration.
- **Logging:** Utilizes Winston for comprehensive error tracking and debugging.
