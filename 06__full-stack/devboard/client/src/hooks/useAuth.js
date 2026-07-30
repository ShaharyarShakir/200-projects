import { useAuthStore } from "../store/authStore";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "../services/auth.service";
import toast from "react-hot-toast";

/**
 * Custom hook to interact with user authentication actions and state.
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const storeLogout = useAuthStore((state) => state.logout);

  /**
   * Check the current user's session status.
   * Invoked on startup to fetch active profile information.
   */
  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await getCurrentUser();
      if (response && response.data) {
        setUser(response.data);
        return response.data;
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
    return null;
  };

  /**
   * Log in user with credentials.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response && response.data) {
        setUser(response.data);
        toast.success("Successfully logged in!");
        return response.data;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Login failed";
      toast.error(errMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user account.
   */
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await registerUser(name, email, password);
      if (response && response.data) {
        setUser(response.data);
        toast.success("Account created successfully!");
        return response.data;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Registration failed";
      toast.error(errMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out the current user session and reset store.
   */
  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      storeLogout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    checkSession,
    login,
    register,
    logout,
  };
};
