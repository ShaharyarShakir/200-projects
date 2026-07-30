import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Protect middleware to restrict route access to authenticated users.
 * Verifies JWT token stored in cookies and attaches the user model to the request.
 */
export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from request cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    const error = new Error("Not authorized to access this resource");
    error.statusCode = 401;
    return next(error);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and attach to request context (excluding password)
    const user = await User.findById(decoded.id);
    if (!user) {
      const error = new Error("No user found with this id");
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (err) {
    const error = new Error("Not authorized, invalid token signature or expiration");
    error.statusCode = 401;
    return next(error);
  }
};
