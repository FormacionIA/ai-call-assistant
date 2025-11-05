import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "TU-ANON-KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
