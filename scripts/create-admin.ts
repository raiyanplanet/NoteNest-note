import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    // Create the user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: "adcd@adcd.com",
        password: "abcd2002",
        email_confirm: true,
      });

    if (authError) {
      console.error("Error creating admin user:", authError);
      return;
    }

    console.log("Admin user created successfully:", authData);

    // Add the user to the admins table
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .insert([{ email: "admin@example.com" }])
      .select()
      .single();

    if (adminError) {
      console.error("Error adding user to admins table:", adminError);
      return;
    }

    console.log("Admin added to admins table:", adminData);
    console.log("\nAdmin credentials:");
    console.log("Email: abcd@abcd.com");
    console.log("Password: abcd1234");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

createAdminUser();
