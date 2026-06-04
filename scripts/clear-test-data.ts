import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// Load environment variables
import dotenv from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Ensure we're using the test environment
process.env.NODE_ENV = "test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env.test") });

const TEST_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000002";

async function clearTestData() {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
    realtime: {
      transport: ws,
    },
  });

  // Delete all test lists
  const { error: listsError } = await supabase
    .from("todo_lists")
    .update({ deleted_at: new Date().toISOString() })
    .eq("household_id", TEST_HOUSEHOLD_ID);

  if (listsError) {
    console.error("Error deleting lists:", listsError.message);
    process.exit(1);
  }

  // Delete all test items
  const { error: itemsError } = await supabase
    .from("todo_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("household_id", TEST_HOUSEHOLD_ID);

  if (itemsError) {
    console.error("Error deleting items:", itemsError.message);
    process.exit(1);
  }
}

clearTestData().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
