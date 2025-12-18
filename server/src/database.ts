import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not found. Using environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get user from JWT token
export async function getUserFromRequest(req: any): Promise<string | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header found');
      return null;
    }

    const token = authHeader.substring(7);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return null;
    }
    
    // Create a client with the JWT token to verify it
    const supabaseWithToken = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error } = await supabaseWithToken.auth.getUser();

    if (error) {
      console.error('Error getting user from token:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return null;
    }

    if (!user) {
      console.log('No user found in token');
      return null;
    }

    console.log('User authenticated successfully:', user.id);
    return user.id;
  } catch (error: any) {
    console.error('Error getting user from token:', {
      message: error.message,
      stack: error.stack
    });
    return null;
  }
}

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
