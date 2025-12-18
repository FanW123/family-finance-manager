import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Supabase 环境变量未设置！请在 Vercel Dashboard → Settings → Environment Variables 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY';
  console.error(errorMsg);
  console.error('当前环境变量值:', {
    VITE_SUPABASE_URL: supabaseUrl || '(未设置)',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '(已设置)' : '(未设置)'
  });
  // 创建一个无效的客户端，但会在使用时抛出更友好的错误
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

