import { verifyToken } from "../services/auth.service.js";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      const error = new Error("Invalid or expired token");
      error.statusCode = 401;
      return next(error);
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};
