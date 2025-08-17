/**
 * MedCure Authentication Hook
 * React hook for managing authentication state and operations
 */

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { useNotification } from "./useNotification";

// Create authentication context
const AuthContext = createContext();

// Mock authentication functions (will be replaced with actual service calls)
const mockAuthService = {
  login: async (credentials) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (
      credentials.username === "admin" &&
      credentials.password === "admin123"
    ) {
      return {
        data: {
          user: {
            id: 1,
            username: "admin",
            email: "admin@medcure.com",
            firstName: "Admin",
            lastName: "User",
            role: "administrator",
            permissions: ["all"],
            isActive: true,
          },
          session: {
            id: Date.now().toString(),
            accessToken: `token_${Date.now()}`,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          },
        },
        error: null,
        success: true,
      };
    }

    return {
      data: null,
      error: "Invalid credentials",
      success: false,
    };
  },

  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { error: null, success: true };
  },

  getCurrentSession: async () => {
    const storedAuth = localStorage.getItem("medcure_auth");
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (new Date() < new Date(auth.session.expiresAt)) {
          return { data: auth, error: null, success: true };
        }
      } catch (e) {
        console.error("Failed to parse stored auth:", e);
      }
    }
    return { data: null, error: "No active session", success: false };
  },

  validateSession: async () => {
    return mockAuthService.getCurrentSession();
  },
};

/**
 * Authentication Hook
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const { showNotification } = useNotification();

  // Store authentication data
  const storeAuth = useCallback((userData, sessionData) => {
    const authData = {
      user: userData,
      session: sessionData,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem("medcure_auth", JSON.stringify(authData));
    setUser(userData);
    setSession(sessionData);
    setIsAuthenticated(true);
    setError(null);
  }, []);

  // Clear authentication data
  const clearAuth = useCallback(() => {
    localStorage.removeItem("medcure_auth");
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  // Login function
  const login = useCallback(
    async (credentials) => {
      setLoading(true);
      setError(null);

      try {
        console.log("🔐 Attempting login...");

        const result = await mockAuthService.login(credentials);

        if (result.success && result.data) {
          storeAuth(result.data.user, result.data.session);
          showNotification("Login successful", "success");
          return { success: true, error: null };
        } else {
          setError(result.error);
          showNotification(`Login failed: ${result.error}`, "error");
          return { success: false, error: result.error };
        }
      } catch (err) {
        console.error("❌ Login error:", err);
        const errorMsg = err.message || "Login failed";
        setError(errorMsg);
        showNotification(`Login failed: ${errorMsg}`, "error");
        return { success: false, error: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [storeAuth, showNotification]
  );

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      console.log("🔐 Logging out...");

      await mockAuthService.logout();
      clearAuth();
      showNotification("Logged out successfully", "info");
      return { success: true, error: null };
    } catch (err) {
      console.error("❌ Logout error:", err);
      // Clear local auth even if server logout fails
      clearAuth();
      return { success: true, error: null };
    } finally {
      setLoading(false);
    }
  }, [clearAuth, showNotification]);

  // Check and validate current session
  const checkSession = useCallback(async () => {
    setLoading(true);

    try {
      console.log("🔐 Checking session...");

      const result = await mockAuthService.getCurrentSession();

      if (result.success && result.data) {
        setUser(result.data.user);
        setSession(result.data.session);
        setIsAuthenticated(true);
        setError(null);
      } else {
        clearAuth();
      }
    } catch (err) {
      console.error("❌ Session check error:", err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (!session) return { success: false, error: "No active session" };

    try {
      console.log("🔐 Refreshing session...");

      const result = await mockAuthService.validateSession();

      if (result.success && result.data) {
        storeAuth(result.data.user, result.data.session);
        return { success: true, error: null };
      } else {
        clearAuth();
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error("❌ Session refresh error:", err);
      clearAuth();
      return { success: false, error: err.message };
    }
  }, [session, storeAuth, clearAuth]);

  // Update user profile
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return { success: false, error: "Not authenticated" };

      try {
        console.log("🔐 Updating profile...");

        // Mock profile update
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updatedUser = { ...user, ...updates };
        storeAuth(updatedUser, session);
        showNotification("Profile updated successfully", "success");

        return { success: true, error: null };
      } catch (err) {
        console.error("❌ Profile update error:", err);
        const errorMsg = err.message || "Profile update failed";
        showNotification(`Profile update failed: ${errorMsg}`, "error");
        return { success: false, error: errorMsg };
      }
    },
    [user, session, storeAuth, showNotification]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission) => {
      if (!user || !user.permissions) return false;

      // Admin role has all permissions
      if (user.role === "administrator" || user.permissions.includes("all")) {
        return true;
      }

      return user.permissions.includes(permission);
    },
    [user]
  );

  // Get user role
  const getRole = useCallback(() => {
    return user?.role || "guest";
  }, [user]);

  // Check if session is expired
  const isSessionExpired = useCallback(() => {
    if (!session || !session.expiresAt) return true;
    return new Date() >= new Date(session.expiresAt);
  }, [session]);

  // Initialize authentication on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Auto-refresh session before expiry
  useEffect(() => {
    if (!session || !session.expiresAt) return;

    const expiryTime = new Date(session.expiresAt).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000);

    const refreshTimer = setTimeout(() => {
      refreshSession();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [session, refreshSession]);

  // Auto-logout on session expiry
  useEffect(() => {
    if (isAuthenticated && isSessionExpired()) {
      console.log("🔐 Session expired, logging out...");
      logout();
      showNotification("Session expired. Please log in again.", "warning");
    }
  }, [isAuthenticated, isSessionExpired, logout, showNotification]);

  return {
    // State
    user,
    session,
    loading,
    isAuthenticated,
    error,

    // Actions
    login,
    logout,
    checkSession,
    refreshSession,
    updateProfile,

    // Utilities
    hasPermission,
    getRole,
    isSessionExpired,

    // Computed properties
    userFullName: user ? `${user.firstName} ${user.lastName}` : "",
    userInitials: user
      ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`
      : "",
    isAdmin: user?.role === "administrator",
    isPharmacist: user?.role === "pharmacist",
    isCashier: user?.role === "cashier",
  };
}

/**
 * Authentication Provider Component
 * Provides authentication context to child components
 */
export function AuthProvider({ children }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// Export default hook
export default useAuth;
