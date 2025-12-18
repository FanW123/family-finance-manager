import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase 环境变量未设置！');
  console.error('请在 Vercel Dashboard → Settings → Environment Variables 中设置：');
  console.error('- VITE_SUPABASE_URL = https://xmxvtpuqcnysbvljdohf.supabase.co');
  console.error('- VITE_SUPABASE_ANON_KEY = sb_publishable_YEkgua3dH6UMxx-j1-Zpaw_aNWL4GX4');
  console.error('当前值:', {
    VITE_SUPABASE_URL: supabaseUrl || '(未设置)',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '(已设置)' : '(未设置)'
  });
}

// 即使环境变量未设置，也创建一个客户端（避免应用崩溃）
// 使用时会返回错误，但不会导致白屏
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

