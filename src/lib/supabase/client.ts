import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseRuntimeConfig, hasSupabaseRuntimeConfig } from '$lib/utils/config';
import ws from 'ws';

let singleton: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (singleton) {
    return singleton;
  }

  if (!hasSupabaseRuntimeConfig()) {
    return null;
  }

  const config = getSupabaseRuntimeConfig();
  singleton = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  });

  return singleton;
}
