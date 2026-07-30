import { registerUser, loginUser } from "../services/auth.service.js";
import { generateToken, sendTokenCookie, clearTokenCookie } from "../utils/token.js";

/**
 * Handles user registration.
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Delegate creation to service
    const user = await registerUser({ name, email, password });

    // Generate token and write HTTP-only cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login.
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Delegate validation to service
    const user = await loginUser({ email, password });

    // Generate token and write HTTP-only cookie
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user logout.
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    clearTokenCookie(res);
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the currently logged in user profile.
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user has already been populated by the protect middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};
