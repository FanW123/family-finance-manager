import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Get user ID from environment variable (for single-user app)
// For multi-user app, this should come from authentication
export const USER_ID = process.env.SUPABASE_USER_ID || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Using environment variables.');
}

if (!USER_ID) {
  console.warn('⚠️ SUPABASE_USER_ID not set! Data isolation may not work correctly.');
  console.warn('Please set SUPABASE_USER_ID in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function initDatabase() {
  try {
    console.log('Initializing Supabase database...');

    // Create tables if they don't exist
    // Note: In Supabase, tables should be created via SQL migrations or dashboard
    // This function just verifies the connection
    
    // Test connection
    const { data, error } = await supabase.from('expenses').select('count').limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('Tables not found. Please create them via Supabase dashboard or migrations.');
      console.log('Required tables: expenses, budgets, investments, target_allocation');
    } else if (error) {
      console.error('Database connection error:', error);
      throw error;
    } else {
      console.log('Database connection successful');
    }

    console.log('Database initialized successfully');
  } catch (error: any) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Export supabase client for use in routes
export default supabase;
