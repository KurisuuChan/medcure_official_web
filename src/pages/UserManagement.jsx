import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Shield,
  Eye,
  UserCheck,
  UserX,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  getUserStats,
} from "../services/userManagementService";
import {
  ROLES,
  hasPermission,
  PERMISSIONS,
  getAssignableRoles,
} from "../services/roleService";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../hooks/useNotification";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({});
  const { user: authUser } = useAuth();
  const effectiveUser = useMemo(
    () =>
      authUser || {
        id: 1,
        role: "administrator",
        permissions: ["admin:all"],
      },
    [authUser]
  );

  const { showNotification } = useNotification();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllUsers(effectiveUser);
      if (result.success) {
        setUsers(result.data);
      } else {
        showNotification(result.error, "error");
      }
    } catch (err) {
      showNotification("Failed to load users", "error");
      console.error("Load users error:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUser, showNotification]);

  const loadStats = useCallback(async () => {
    try {
      const result = await getUserStats(effectiveUser);
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Failed to load user stats:", err);
    }
  }, [effectiveUser]);

  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await loadUsers();
      await loadStats();
    };
    initializeData();
  }, [loadUsers, loadStats]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) =>
        statusFilter === "active" ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = async (userData) => {
    try {
      const result = await createUser(effectiveUser, userData);
      if (result.success) {
        showNotification("User created successfully", "success");
        setShowCreateModal(false);
        loadUsers();
        loadStats();
      } else {
        showNotification(result.error, "error");
      }
    } catch (err) {
      showNotification("Failed to create user", "error");
      console.error("Create user error:", err);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const result = await updateUser(effectiveUser, userId, updates);
      if (result.success) {
        showNotification("User updated successfully", "success");
        setShowEditModal(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        showNotification(result.error, "error");
      }
    } catch (err) {
      showNotification("Failed to update user", "error");
      console.error("Update user error:", err);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;

    try {
      const result = await deactivateUser(effectiveUser, userId);
      if (result.success) {
        showNotification("User deactivated successfully", "success");
        loadUsers();
        loadStats();
      } else {
        showNotification(result.error, "error");
      }
    } catch (err) {
      showNotification("Failed to deactivate user", "error");
      console.error("Deactivate user error:", err);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!confirm("Are you sure you want to reset this user's password?"))
      return;

    try {
      const result = await resetUserPassword(effectiveUser, userId);
      if (result.success) {
        showNotification("Password reset successfully", "success");
      } else {
        showNotification(result.error, "error");
      }
    } catch (err) {
      showNotification("Failed to reset password", "error");
      console.error("Reset password error:", err);
    }
  };

  const getRoleColor = (roleName) => {
    const role = Object.values(ROLES).find((r) => r.name === roleName);
    return role ? role.color : "#6b7280";
  };

  const getRoleDisplayName = (roleName) => {
    const role = Object.values(ROLES).find((r) => r.name === roleName);
    return role ? role.displayName : roleName;
  };

  // Check permissions
  const canCreateUsers = hasPermission(effectiveUser, PERMISSIONS.USER_CREATE);
  const canEditUsers = hasPermission(effectiveUser, PERMISSIONS.USER_UPDATE);
  const canDeleteUsers = hasPermission(effectiveUser, PERMISSIONS.USER_DELETE);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage admin and employee accounts
          </p>
        </div>

        {canCreateUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add User
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.total || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active || 0}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive Users</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.inactive || 0}
              </p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Recent Logins</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.recentLogins || 0}
              </p>
            </div>
            <Eye className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            {Object.values(ROLES).map((role) => (
              <option key={role.name} value={role.name}>
                {role.displayName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  User
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Role
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Department
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Last Login
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          ID: {user.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: getRoleColor(user.role) }}
                    >
                      {getRoleDisplayName(user.role)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-800">{user.department}</p>
                    <p className="text-sm text-gray-500">{user.jobTitle}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-gray-800">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : "Never"}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {canEditUsers && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit User"
                        >
                          <Edit size={16} />
                        </button>
                      )}

                      {hasPermission(
                        effectiveUser,
                        PERMISSIONS.USER_UPDATE
                      ) && (
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                      )}

                      {canDeleteUsers && user.id !== effectiveUser.id && (
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Deactivate User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateUser}
          currentUser={effectiveUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUpdate={handleUpdateUser}
          currentUser={effectiveUser}
        />
      )}
    </div>
  );
}

// Create User Modal Component
function CreateUserModal({ onClose, onCreate, currentUser }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "cashier",
    phone: "",
    jobTitle: "",
    department: "",
    employeeId: "",
    salary: "",
    dateHired: new Date().toISOString().split("T")[0],
    licenseNumber: "",
    address: {
      street: "",
      city: "",
      province: "",
      zipCode: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  const assignableRoles = getAssignableRoles(currentUser);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {assignableRoles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Job Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                <option value="Administration">Administration</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Sales">Sales</option>
                <option value="Customer Service">Customer Service</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component (simplified version)
function EditUserModal({ user, onClose, onUpdate, currentUser }) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    role: user.role || "",
    phone: user.phone || "",
    jobTitle: user.jobTitle || "",
    department: user.department || "",
    isActive: user.isActive,
  });

  const assignableRoles = getAssignableRoles(currentUser);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(user.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {assignableRoles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Active User
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
