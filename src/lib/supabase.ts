import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL ?? "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
export const isConfigured = /^https?:\/\//.test(url) && !url.includes("YOUR_PROJECT_ID") && key.length > 20 && !key.startsWith("YOUR_");
export const supabase = isConfigured ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" } }) : null;
