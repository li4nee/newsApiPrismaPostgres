import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token is there
  if (!authHeader) {
    return res.status(400).json({
      errors: {
        token: "Unauthorized Access. No token",
      },
    });
  }

  // Remove the bearer part
  const token = authHeader.split(" ")[1].replace('"', "");
  // Check if token is correct
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(400).json({
        errors: {
          token: "Unauthorized Access. Wrong token",
        },
      });
    }
    console.log(decoded);
    // check if user validated
    if (!decoded.data.isValidated) {
      return res.status(400).json({
        errors: {
          token: "Unauthorized Access.Email not validated",
        },
      });
    }
    req.user = decoded.data;
    next();
  });
};

export default authMiddleware;
