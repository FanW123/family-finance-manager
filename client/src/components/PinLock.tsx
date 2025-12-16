import { useState, useEffect } from 'react';

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

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    // Check if PIN is already set
    const storedPin = localStorage.getItem('firepath_pin');
    if (!storedPin) {
      setIsSettingUp(true);
    }
  }, []);

  const handlePinSubmit = () => {
    if (isSettingUp) {
      // Setting up new PIN
      if (pin.length < 4) {
        setError('PIN码至少需要4位数字');
        return;
      }
      if (pin !== confirmPin) {
        setError('两次输入的PIN码不一致');
        return;
      }
      // Store PIN (in production, should be hashed)
      localStorage.setItem('firepath_pin', btoa(pin)); // Simple base64 encoding
      localStorage.setItem('firepath_pin_set', 'true');
      setIsSettingUp(false);
      setPin('');
      setConfirmPin('');
      setError('');
      onUnlock();
    } else {
      // Verifying PIN
      const storedPin = localStorage.getItem('firepath_pin');
      if (storedPin && btoa(pin) === storedPin) {
        setError('');
        onUnlock();
      } else {
        setError('PIN码错误');
        setPin('');
      }
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置PIN码吗？这将清除所有本地数据！')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePinSubmit();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: '"Outfit", -apple-system, sans-serif'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet" />
      
      <div style={{
        background: COLORS.card,
        borderRadius: '2rem',
        padding: '3rem 2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          {isSettingUp ? '🔐' : '🔒'}
        </div>
        
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: '700',
          margin: '0 0 0.5rem 0',
          background: `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          FirePath
        </h1>
        
        <p style={{
          color: COLORS.textMuted,
          marginBottom: '2rem',
          fontSize: '0.95rem'
        }}>
          {isSettingUp ? '设置PIN码以保护您的数据' : '请输入PIN码解锁'}
        </p>

        {error && (
          <div style={{
            background: `${COLORS.highlight}20`,
            border: `1px solid ${COLORS.highlight}`,
            borderRadius: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            color: COLORS.highlight,
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only numbers
              if (value.length <= 6) {
                setPin(value);
                setError('');
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={isSettingUp ? '输入PIN码（4-6位）' : '输入PIN码'}
            autoFocus
            style={{
              width: '100%',
              padding: '1rem',
              background: COLORS.accent,
              border: 'none',
              borderRadius: '0.75rem',
              color: COLORS.text,
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace',
              marginBottom: isSettingUp ? '1rem' : '0'
            }}
          />

          {isSettingUp && (
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Only numbers
                if (value.length <= 6) {
                  setConfirmPin(value);
                  setError('');
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="确认PIN码"
              style={{
                width: '100%',
                padding: '1rem',
                background: COLORS.accent,
                border: 'none',
                borderRadius: '0.75rem',
                color: COLORS.text,
              fontSize: '1.5rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace'
              }}
            />
          )}
        </div>

        <button
          onClick={handlePinSubmit}
          disabled={pin.length < 4 || (isSettingUp && confirmPin.length < 4)}
          style={{
            width: '100%',
            padding: '1rem',
            background: pin.length >= 4 && (!isSettingUp || confirmPin.length >= 4)
              ? `linear-gradient(135deg, ${COLORS.highlight} 0%, ${COLORS.success} 100%)`
              : COLORS.accent,
            border: 'none',
            borderRadius: '0.75rem',
            color: COLORS.text,
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: pin.length >= 4 && (!isSettingUp || confirmPin.length >= 4) ? 'pointer' : 'not-allowed',
            opacity: pin.length >= 4 && (!isSettingUp || confirmPin.length >= 4) ? 1 : 0.5,
            fontFamily: 'inherit',
            marginBottom: '1rem'
          }}
        >
          {isSettingUp ? '设置PIN码' : '解锁'}
        </button>

        {!isSettingUp && (
          <button
            onClick={() => setShowReset(!showReset)}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textMuted,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: showReset ? '1rem' : '0'
            }}
          >
            {showReset ? '取消' : '忘记PIN码？'}
          </button>
        )}

        {showReset && (
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: `${COLORS.warning}20`,
              border: `1px solid ${COLORS.warning}`,
              borderRadius: '0.5rem',
              color: COLORS.warning,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ⚠️ 重置PIN码（清除所有数据）
          </button>
        )}

        {isSettingUp && (
          <p style={{
            color: COLORS.textMuted,
            fontSize: '0.8rem',
            marginTop: '1.5rem',
            lineHeight: '1.5'
          }}>
            💡 提示：PIN码用于保护您的财务数据。请务必记住，忘记PIN码需要清除所有数据才能重置。
          </p>
        )}
      </div>
    </div>
  );
};

export default PinLock;

