import { env } from "@pstrack/env/server";
import { createClient } from "@supabase/supabase-js";

export const supabaseStorage = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
	auth: {
		persistSession: false,
	},
});
