import { supabase } from "../config/supabase.js";

/**
 * Quick notification system test - Run this to check if everything works
 */
export async function testNotificationSystem() {
  console.log("🧪 Testing notification system...");

  try {
    // Test 1: Check if notifications table exists
    console.log("1️⃣ Testing table access...");
    const { data: testQuery, error: testError } = await supabase
      .from("notifications")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Table access failed:", testError);
      return { success: false, error: "Notifications table not accessible" };
    }

    console.log("✅ Table access successful");

    // Test 2: Try creating a test notification
    console.log("2️⃣ Testing notification creation...");
    const { data: createResult, error: createError } = await supabase
      .from("notifications")
      .insert([
        {
          title: "System Test",
          message: "This is a test notification - safe to delete",
          type: "info",
          category: "system",
          priority: 1,
          is_read: false,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (createError) {
      console.error("❌ Creation failed:", createError);
      return { success: false, error: "Cannot create notifications" };
    }

    console.log("✅ Notification creation successful");

    // Test 3: Try reading notifications
    console.log("3️⃣ Testing notification reading...");
    const { data: readResult, error: readError } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (readError) {
      console.error("❌ Reading failed:", readError);
      return { success: false, error: "Cannot read notifications" };
    }

    console.log("✅ Notification reading successful");

    // Test 4: Clean up test notification
    if (createResult?.id) {
      await supabase.from("notifications").delete().eq("id", createResult.id);
      console.log("✅ Test cleanup completed");
    }

    return {
      success: true,
      message: "All notification tests passed!",
      existingNotifications: readResult?.length || 0,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error: error.message };
  }
}

// Export for easy testing
export default testNotificationSystem;
