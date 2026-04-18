export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = import.meta.env;

  return {
    url: typeof PUBLIC_SUPABASE_URL === 'string' ? PUBLIC_SUPABASE_URL : '',
    anonKey: typeof PUBLIC_SUPABASE_ANON_KEY === 'string' ? PUBLIC_SUPABASE_ANON_KEY : '',
    serviceRoleKey: typeof SUPABASE_SERVICE_ROLE_KEY === 'string' ? SUPABASE_SERVICE_ROLE_KEY : undefined
  };
}

export function hasSupabaseRuntimeConfig(): boolean {
  const config = getSupabaseRuntimeConfig();
  return Boolean(config.url && config.anonKey);
}
