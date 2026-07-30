import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";

/**
 * Service to handle registration logic.
 * @param {object} userData - contains name, email, password.
 * @returns {Promise<object>} The created user instance.
 */
export const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const err = new Error("All fields (name, email, password) are required");
    err.statusCode = 400;
    throw err;
  }

  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("Email is already registered");
    err.statusCode = 400;
    throw err;
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Return user without password (though select:false handles it in subsequent queries, let's convert to object and delete password field to be safe)
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Service to handle login verification logic.
 * @param {object} credentials - contains email, password.
 * @returns {Promise<object>} The logged-in user instance.
 */
export const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  // Find user and explicitly select password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  // Verify password
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  // Convert to object and omit password
  const userObj = user.toObject();
  delete userObj.password;
  return userObj;
};

/**
 * Service to retrieve a user profile by database ID.
 * @param {string} userId - The database user ID.
 * @returns {Promise<object>} The user instance.
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};
