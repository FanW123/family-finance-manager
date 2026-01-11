import { useState } from 'react';
import { supabase } from '../lib/supabase';

const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  highlight: '#e94560',
  success: '#00d9ff',
  warning: '#ffd369',
  background: '#0a0a14',
  card: '#16213e',
  text: '#eee',
  textMuted: '#a0a0b0'
};

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          onAuthSuccess();
        }
      } else {
        // Sign up
        // Get the current origin (works for both localhost and production)
        const redirectTo = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo
          }
        });

        if (error) throw error;

        if (data.user) {
          setMessage('注册成功！请检查邮箱验证链接（如果启用了邮箱验证）');
          // Auto login after signup
          setTimeout(() => {
            onAuthSuccess();
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || '认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: COLORS.card,
        borderRadius: '1.5rem',
        padding: '3rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: `1px solid ${COLORS.accent}`
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            color: COLORS.text,
            fontSize: '2rem',
            margin: '0 0 0.5rem 0',
            fontWeight: '700'
          }}>
            🔥 FirePath
          </h1>
          <p style={{
            color: COLORS.textMuted,
            fontSize: '0.9rem',
            margin: 0
          }}>
            {isLogin ? '登录你的账户' : '创建新账户'}
          </p>
        </div>

        {error && (
          <div style={{
            background: `${COLORS.highlight}20`,
            border: `1px solid ${COLORS.highlight}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: COLORS.highlight,
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: `${COLORS.success}20`,
            border: `1px solid ${COLORS.success}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: COLORS.success,
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{
              display: 'block',
              color: COLORS.textMuted,
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: COLORS.accent,
                border: `1px solid ${COLORS.secondary}`,
                borderRadius: '0.5rem',
                color: COLORS.text,
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: COLORS.textMuted,
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: COLORS.accent,
                border: `1px solid ${COLORS.secondary}`,
                borderRadius: '0.5rem',
                color: COLORS.text,
                fontSize: '1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? COLORS.accent : `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.highlight} 100%)`,
              border: 'none',
              borderRadius: '0.5rem',
              color: COLORS.text,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.success,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? '还没有账户？注册' : '已有账户？登录'}
          </button>
        </div>
      </div>
    </div>
  );
}

