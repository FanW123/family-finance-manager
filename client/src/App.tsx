import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FinanceDashboard from './pages/FinanceDashboard';
import InstallPrompt from './components/InstallPrompt';
import PinLock from './components/PinLock';

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if PIN is set and if app should be locked
    const pinSet = localStorage.getItem('firepath_pin_set');
    const isUnlocked = sessionStorage.getItem('firepath_unlocked') === 'true';
    
    if (!pinSet) {
      // No PIN set, show setup screen
      setIsLocked(true);
      setIsChecking(false);
    } else if (isUnlocked) {
      // Already unlocked in this session
      setIsLocked(false);
      setIsChecking(false);
    } else {
      // PIN is set, need to unlock
      setIsLocked(true);
      setIsChecking(false);
    }
  }, []);

  const handleUnlock = () => {
    sessionStorage.setItem('firepath_unlocked', 'true');
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem('firepath_unlocked');
    setIsLocked(true);
  };

  if (isChecking) {
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

  if (isLocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  return (
    <Router>
      <InstallPrompt />
      <LockButton onLock={handleLock} />
      <Routes>
        <Route path="/" element={<FinanceDashboard />} />
      </Routes>
    </Router>
  );
}

function LockButton({ onLock }: { onLock: () => void }) {
  return (
    <button
      onClick={onLock}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        background: 'rgba(26, 26, 46, 0.8)',
        border: '1px solid rgba(233, 69, 96, 0.5)',
        borderRadius: '50%',
        width: '3rem',
        height: '3rem',
        color: '#eee',
        fontSize: '1.5rem',
        cursor: 'pointer',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease'
      }}
      title="锁定应用"
    >
      🔒
    </button>
  );
}

export default App;

