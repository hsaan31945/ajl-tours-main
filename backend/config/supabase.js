const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key is missing. Supabase integration will not work.');
}

const createMissingSupabaseClient = () => {
  const error = () => {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY to use Supabase-backed features.');
  };

  return {
    auth: {
      signUp: error,
      signInWithPassword: error,
      getUser: error,
    },
    from: error,
  };
};

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMissingSupabaseClient();

module.exports = supabase;
