import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente server-side com service role (bypassa RLS — usar apenas em API routes e cron)
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios");
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}
