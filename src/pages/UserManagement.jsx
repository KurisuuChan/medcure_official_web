import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUserRole, inviteUser } from "../services/userService.js";
import { Shield, User, Mail, Plus, MoreVertical, AlertTriangle } from "lucide-react";
import { useNotification } from "../hooks/useNotification.js";
import { getCurrentRole } from "../services/roleAuthService.js";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");

  const userRole = getCurrentRole();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: userRole === 'admin', // Only fetch if user is admin
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      addNotification("User role updated successfully", "success");
    },
    onError: (err) => {
      addNotification(err.message || "Failed to update user role", "error");
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: ({ email, role }) => inviteUser(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      addNotification("Invitation sent successfully!", "success");
      setInviteEmail("");
    },
    onError: (err) => {
      addNotification(err.message || "Failed to send invitation", "error");
    },
  });

  const handleRoleChange = (userId, newRole) => {
    const user = users.find(u => u.user_id === userId);
    if (window.confirm(`Are you sure you want to change the role of ${user.email} to ${newRole}?`)) {
      updateUserMutation.mutate({ userId, role: newRole });
    }
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!inviteEmail) {
        addNotification("Please enter an email address to invite.", "warning");
        return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  if (userRole !== 'admin') {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error fetching users: {error.message}</div>;
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
      </div>

      {/* Invite User Form */}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Invite New User</h2>
        <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter user email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviteUserMutation.isPending}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            <Mail size={16} />
            {inviteUserMutation.isPending ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">User</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Role</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">Joined</th>
              <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {user.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{user.full_name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-center">
                   <div className="relative inline-block">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={updateUserMutation.isPending && updateUserMutation.variables?.userId === user.user_id}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
