import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kfxwjfagaalrmleascrt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_G7IHND3KoSst9-NOrRnFSQ_usq26bye";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "indica-iec-auth",
  },
});
