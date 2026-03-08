import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, LogOut, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  lastEventTimestamp?: number | null;
}

const Navbar: React.FC<NavbarProps> = ({ lastEventTimestamp }) => {
  const { account, connectWallet, disconnectWallet } = useWeb3();
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // In pure CRE mode, the engine is always "Decentralized" and powered by Chainlink
    setIsBackendOnline(true);
  }, []);

  useEffect(() => {
    // Demo mode: 30 minute drops (1,800,000 ms) to match backend
    const DROP_INTERVAL = 1800000; 
    const baseTimestamp = lastEventTimestamp || (Date.now() - 900000);
    
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLast = (now - baseTimestamp) % DROP_INTERVAL;
      const nextDrop = now + (DROP_INTERVAL - timeSinceLast);
      
      let diff = nextDrop - now;
      
      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }
      
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastEventTimestamp]);


  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      background: 'rgba(5, 5, 5, 0.8)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white',
          fontSize: '18px'
        }}>D</div>
        <h1 style={{ fontSize: '20px', margin: 0 }}>Domino Market</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Backend Engine Status Indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '6px 12px', 
          background: 'rgba(5, 5, 5, 0.4)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-subtle)',
          fontSize: '12px'
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: isBackendOnline === null ? '#f59e0b' : (isBackendOnline ? '#10b981' : '#ef4444'),
            boxShadow: isBackendOnline ? '0 0 10px #10b981' : 'none',
            animation: isBackendOnline ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            AI ORACLE: {isBackendOnline === null ? 'SYNCING' : 'ACTIVE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-primary)' }}>
          <Clock size={16} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Next drop: {timeLeft}</span>
        </div>

        <Link to="/whitepaper" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Whitepaper
        </Link>
        <Link to="/positions" className="nav-link" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>My Positions</Link>
        
        {account ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--glass-bg)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button onClick={disconnectWallet} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={connectWallet}>
            <Wallet size={18} />
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
