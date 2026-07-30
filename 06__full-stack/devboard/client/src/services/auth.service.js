import API from "../api/axios";

/**
 * Register a new user
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} Response data containing success and the created user
 */
export const registerUser = async (name, email, password) => {
  const response = await API.post("/auth/register", { name, email, password });
  return response.data;
};

/**
 * Log in an existing user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<object>} Response data containing success and the user profile
 */
export const loginUser = async (email, password) => {
  const response = await API.post("/auth/login", { email, password });
  return response.data;
};

/**
 * Log out the current user session
 * @returns {Promise<object>} Response data containing success message
 */
export const logoutUser = async () => {
  const response = await API.post("/auth/logout");
  return response.data;
};

/**
 * Fetch the authenticated user profile for the current session
 * @returns {Promise<object>} Response data containing success and user profile details
 */
export const getCurrentUser = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};
