import { createClient } from '@supabase/supabase-js'

// Supports both NEXT_PUBLIC_ (Next.js standard) and VITE_ (Vite standard) naming
const supabaseUrl = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  ''
).trim()

const supabaseAnonKey = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('placeholder')
)

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [Supabase Configuration Error]\n' +
    'Missing required Supabase connection settings in .env.local.\n' +
    'Please set:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key\n' +
    '(or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)'
  )
}

// Create singleton Supabase client
export const supabase = createClient<any>(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export function getSupabaseConfig() {
  return {
    url: supabaseUrl || null,
    isConfigured: isSupabaseConfigured,
  }
}

export default supabase
