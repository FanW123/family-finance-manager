import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import FinanceDashboard from './pages/FinanceDashboard';
import InstallPrompt from './components/InstallPrompt';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // User will be set via onAuthStateChange
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#eee'
      }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <Router>
      <InstallPrompt />
      <SignOutButton onSignOut={handleSignOut} />
      <Routes>
        <Route path="/" element={<FinanceDashboard />} />
      </Routes>
    </Router>
  );
}

function SignOutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      onClick={onSignOut}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: 'rgba(26, 26, 46, 0.8)',
        border: '1px solid rgba(233, 69, 96, 0.5)',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        color: '#eee',
        fontSize: '0.9rem',
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        fontFamily: 'inherit'
      }}
      title="退出登录"
    >
      🚪 退出
    </button>
  );
}

export default App;

