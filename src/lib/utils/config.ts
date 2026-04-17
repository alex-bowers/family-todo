export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

function readEnv(name: string): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value : '';
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  return {
    url: readEnv('PUBLIC_SUPABASE_URL'),
    anonKey: readEnv('PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY') || undefined
  };
}

export function hasSupabaseRuntimeConfig(): boolean {
  const config = getSupabaseRuntimeConfig();
  return Boolean(config.url && config.anonKey);
}
