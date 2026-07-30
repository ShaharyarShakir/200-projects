import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT for the user.
 * @param {string} userId - The database ID of the user.
 * @returns {string} The signed JWT.
 */
export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in environmental variables");
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn: "30d",
  });
};

/**
 * Sends a JWT token inside an HTTP-only, secure cookie.
 * @param {object} res - Express response object.
 * @param {string} token - The signed JWT token.
 */
export const sendTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res.cookie("token", token, options);
};

/**
 * Clears the JWT token cookie.
 * @param {object} res - Express response object.
 */
export const clearTokenCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};
