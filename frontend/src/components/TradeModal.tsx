import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { MarketService, type MarketData } from '../services/MarketService';
import { useWeb3 } from '../context/Web3Context';

interface TradeModalProps {
  market: MarketData;
  isEventA: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REGISTRY_ADDR = "0x5a5b785f9f5Ed61f0A839a6CABBaB029b4Ba2C8B";
const ENGINE_ADDR = "0xF5d91d8DEe6c6d8044A7a09DC299F6E124d5C603";

const TradeModal: React.FC<TradeModalProps> = ({ market, isEventA, onClose, onSuccess }) => {
  const { signer, isCorrectNetwork } = useWeb3();
  const [isYes, setIsYes] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [expectedShares, setExpectedShares] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const updateQuote = async () => {
      if (!signer) return;
      try {
        // Simplified quote calculation for the UI
        const amount = Number(stakeAmount) || 0;
        if (amount > 0) {
          let prob: number;
          if (isEventA) {
            prob = isYes ? market.aYesOdds : market.aNoOdds;
          } else {
            prob = isYes ? market.bYesOdds : market.bNoOdds;
          }
          const estimate = (amount / (prob / 100)) * 0.98; // 2% slippage estimate
          setExpectedShares(estimate.toFixed(4));
        } else {
          setExpectedShares('0');
        }
      } catch (e) {
        console.error("Quote error:", e);
      }
    };
    updateQuote();
  }, [stakeAmount, isYes, market, signer]);

  const handleTrade = async () => {
    if (!signer || !isCorrectNetwork) return;
    setLoading(true);
    try {
      const service = new MarketService(signer, REGISTRY_ADDR, ENGINE_ADDR);
      await service.buyPosition(market.marketId, isEventA, isYes, stakeAmount);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Trade failed:", error);
      alert("Trade transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3>Execute Trade</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            {isEventA ? 'TRIGGER EVENT' : 'TARGET OUTCOME'}
          </div>
          <div style={{ fontSize: '16px', color: 'white', fontWeight: 500, lineHeight: 1.4 }}>
            {isEventA ? market.descriptionA : market.descriptionB}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button 
            onClick={() => setIsYes(true)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: isYes ? 'var(--success)' : 'var(--border-subtle)',
              background: isYes ? 'rgba(16, 185, 129, 0.1)' : 'var(--glass-bg)',
              color: isYes ? 'var(--success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <TrendingUp size={24} />
            <span style={{ fontWeight: 700 }}>YES</span>
            <span style={{ fontSize: '12px' }}>
              {isEventA ? market.aYesOdds.toFixed(1) : market.bYesOdds.toFixed(1)}%
            </span>
          </button>
          <button 
            onClick={() => setIsYes(false)}
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: !isYes ? 'var(--error)' : 'var(--border-subtle)',
              background: !isYes ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-bg)',
              color: !isYes ? 'var(--error)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)'
            }}
          >
            <TrendingDown size={24} />
            <span style={{ fontWeight: 700 }}>NO</span>
            <span style={{ fontSize: '12px' }}>
              {isEventA ? market.aNoOdds.toFixed(1) : market.bNoOdds.toFixed(1)}%
            </span>
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Stake Amount (ETH)
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="number"
              step="0.01"
              className="input-field"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              style={{ fontSize: '18px', padding: '16px' }}
            />
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
              ETH
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Estimated Shares</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{expectedShares}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Price Impact</span>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>&lt; 0.5%</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontWeight: 600 }}>Total Payout if Correct</span>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{expectedShares} ETH</span>
          </div>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '18px', fontSize: '16px', justifyContent: 'center' }}
          disabled={loading || (signer !== null && !isCorrectNetwork)}
          onClick={handleTrade}
        >
          {loading ? "Confirming Transaction..." : (signer && !isCorrectNetwork) ? "Wrong Network (Use Sepolia)" : `Buy ${isYes ? 'YES' : 'NO'} Position`}
        </button>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', justifyContent: 'center' }}>
          <Info size={14} />
          Shares are redeemable 1:1 for ETH if the outcome is correct.
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
