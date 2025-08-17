import React, { createContext, useContext, useState, useEffect } from "react";
import { PERMISSIONS } from "../services/roleService";
import {
  getCurrentSession,
  login as authLogin,
  logout as authLogout,
} from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const session = await getCurrentSession();
      if (session.success && session.data) {
        setUser(session.data);
      } else {
        // Check for existing session on app load
        const storedUser = localStorage.getItem("medcure_user");
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Enhance stored user with default permissions if missing
            if (!userData.permissions) {
              userData.permissions =
                userData.role === "administrator"
                  ? [PERMISSIONS.ADMIN_ALL]
                  : [];
            }
            setUser(userData);
          } catch (error) {
            console.error("Failed to parse stored user:", error);
            localStorage.removeItem("medcure_user");
            // Set mock admin user for development
            const mockUser = {
              id: 1,
              firstName: "Admin",
              lastName: "User",
              email: "admin@medcure.com",
              role: "administrator",
              permissions: [PERMISSIONS.ADMIN_ALL],
              department: "Administration",
              jobTitle: "System Administrator",
              employeeId: "ADM001",
              isActive: true,
              lastLogin: new Date().toISOString(),
            };
            setUser(mockUser);
            localStorage.setItem("medcure_user", JSON.stringify(mockUser));
          }
        } else {
          // Set mock admin user for development
          const mockUser = {
            id: 1,
            firstName: "Admin",
            lastName: "User",
            email: "admin@medcure.com",
            role: "administrator",
            permissions: [PERMISSIONS.ADMIN_ALL],
            department: "Administration",
            jobTitle: "System Administrator",
            employeeId: "ADM001",
            isActive: true,
            lastLogin: new Date().toISOString(),
          };
          setUser(mockUser);
          localStorage.setItem("medcure_user", JSON.stringify(mockUser));
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    try {
      const result = await authLogin(credentials);
      if (result.success) {
        setUser(result.data);
        localStorage.setItem("medcure_user", JSON.stringify(result.data));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Fallback for mock login during development
      const userData = {
        id: 1,
        firstName: credentials.firstName || "Admin",
        lastName: credentials.lastName || "User",
        email: credentials.email || "admin@medcure.com",
        role: credentials.role || "administrator",
        permissions: [PERMISSIONS.ADMIN_ALL],
        department: "Administration",
        jobTitle: "System Administrator",
        employeeId: "ADM001",
        isActive: true,
        lastLogin: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem("medcure_user", JSON.stringify(userData));
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("medcure_user");
      setLoading(false);
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("medcure_user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to check if current user has a specific permission
export function usePermission(permission) {
  const { user } = useAuth();

  if (!user) return false;

  // Admin has all permissions
  if (user.permissions?.includes(PERMISSIONS.ADMIN_ALL)) {
    return true;
  }

  // Check specific permission
  return user.permissions?.includes(permission) || false;
}

// Hook to check multiple permissions
export function usePermissions(permissions) {
  const { user } = useAuth();

  if (!user)
    return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {});

  return permissions.reduce((acc, permission) => {
    // Admin has all permissions
    if (user.permissions?.includes(PERMISSIONS.ADMIN_ALL)) {
      acc[permission] = true;
    } else {
      acc[permission] = user.permissions?.includes(permission) || false;
    }
    return acc;
  }, {});
}
