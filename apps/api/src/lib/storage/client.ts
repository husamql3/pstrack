import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

export const supabaseStorage = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
	auth: {
		persistSession: false,
	},
});
