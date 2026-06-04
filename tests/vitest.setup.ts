import { resetSupabaseClient } from '../src/lib/supabase/client';
import { vi } from 'vitest';

// Clean up resources after each test to prevent hanging processes
afterEach(() => {
  // Reset Supabase client
  resetSupabaseClient();

  // Clear all mocks
  vi.clearAllMocks();
});

// Also clean up after all tests
afterAll(() => {
  // Reset Supabase client
  resetSupabaseClient();
});
