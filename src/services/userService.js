import { supabase } from "../config/supabase.js";

/**
 * Service for user management operations.
 * Requires admin privileges.
 */

/**
 * Fetches all user profiles from the database.
 * @returns {Promise<Array>} A list of user profiles.
 */
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Failed to get users:", error);
    return [];
  }
}

/**
 * Updates the role of a specific user.
 * @param {string} userId - The UUID of the user to update.
 * @param {string} role - The new role to assign ('admin' or 'employee').
 * @returns {Promise<Object>} The result of the update operation.
 */
export async function updateUserRole(userId, role) {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      throw new Error(error.message);
    }

    // Also update the metadata in auth.users for consistency
    await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: role }
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Invites a new user by email with a specific role.
 * @param {string} email - The email of the user to invite.
 * @param {string} role - The role to assign to the new user.
 * @returns {Promise<Object>} The result of the invitation.
 */
export async function inviteUser(email, role) {
  try {
    // This function requires the `service_role` key to be configured in the Supabase client.
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { role: role },
    });

    if (error) {
      console.error("Error inviting user:", error);
      // Provide a more helpful error message for common issues
      if (error.message.includes("permission denied")) {
          throw new Error("Failed to invite user: Permission denied. Ensure you have admin privileges and the service role key is configured correctly.");
      }
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to invite user:", error);
    return { success: false, error: error.message };
  }
}
