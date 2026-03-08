import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './context/Web3Context';
import { MarketService, type MarketData, type UserPosition } from './services/MarketService';
import { RefreshCw, BarChart3, Wallet, TrendingUp, ArrowLeft, Zap, TrendingDown } from 'lucide-react';
import Navbar from './components/Navbar';
import { Web3Provider } from './context/Web3Context';
import TradeModal from './components/TradeModal';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import { useNavigate, useParams, Outlet, useOutletContext } from 'react-router-dom';

const REGISTRY_ADDR = "0x5a5b785f9f5Ed61f0A839a6CABBaB029b4Ba2C8B";
const ENGINE_ADDR = "0xF5d91d8DEe6c6d8044A7a09DC299F6E124d5C603";

type ContextType = {
  markets: MarketData[];
  loading: boolean;
  fetchMarkets: () => void;
  setSelectedMarket: (m: MarketData | null, isEventA?: boolean) => void;
};

export function useMarketOutlet() {
  return useOutletContext<ContextType>();
}

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate();
  const { markets, loading, fetchMarkets } = useMarketOutlet();
  const { account, connectWallet } = useWeb3();

  return (
    <>
      <section style={{ 
        position: 'relative',
        padding: '60px 40px',
        marginBottom: '48px',
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 0 50px rgba(0, 240, 255, 0.05)'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 100%)',
            zIndex: 1
          }} />
          <div className="hero-animated-bg" style={{ width: '100%', height: '100%' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
          <div style={{ 
            display: 'inline-flex', padding: '6px 16px', background: 'rgba(0, 240, 255, 0.05)', 
            borderRadius: '20px', border: '1px solid rgba(0, 240, 255, 0.2)', color: 'var(--accent-primary)',
            fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '24px',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)'
          }}>
            <Zap size={16} style={{ marginRight: '6px' }} />
            NEXT-GEN ORACLE ENGINE
          </div>
          
          <h2 style={{ 
            fontSize: '48px', fontWeight: 800, marginBottom: '16px', 
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 50%, var(--accent-primary) 100%)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
            lineHeight: 1.1, letterSpacing: '-0.02em'
          }}>
            Predict the Unpredictable.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '32px', lineHeight: 1.6 }}>
            Build, trade, and monitor multi-stage <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Domino Effect</span> markets powered by decentralized AI Oracles.
          </p>
          
          {!account && (
            <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '12px' }} onClick={connectWallet}>
              <Wallet size={18} />
              Connect Wallet to Trade
            </button>
          )}
        </div>
        
        {account && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '12px' }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/positions')}>
              <TrendingUp size={18} />
              My Positions
            </button>
          </div>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '24px' }}>Active Opportunities</h3>
          {loading && <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />}
        </div>
        <button className="btn-secondary" onClick={fetchMarkets} style={{ padding: '8px 16px', fontSize: '14px' }}>
          Refresh Data
        </button>
      </div>

      {markets.length === 0 && !loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '80px' }}>
          <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>No active markets found</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>The AI Agent will deploy new cascading prediction markets soon.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {markets.map((m: any) => (
            <div key={m.marketId} className="glass-card list-row" onClick={() => navigate(`/market/${m.marketId}`)}>
              <div className="row-status">
                <span className={`badge ${m.state === 0 ? 'badge-active' : m.state === 1 ? 'badge-monitoring' : 'badge-settled'}`}>
                  {m.state === 0 ? 'Monitoring A' : m.state === 1 ? 'Monitoring B' : 'Settled'}
                </span>
              </div>
              
              <div className="row-content">
                <div className="event-block event-a">
                  <div className="event-label">TRIGGER EVENT</div>
                  <h4 className="event-title">{m.descriptionA}</h4>
                </div>
                
                <div className="event-arrow">
                  <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </div>
                
                <div className="event-block event-b">
                  <div className="event-label">TARGET OUTCOME</div>
                  <h4 className="event-title">{m.descriptionB}</h4>
                </div>
              </div>

              <div className="row-stats">
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(m.totalLiquidityA) + Number(m.totalLiquidityB)} ETH</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL LIQ.</div>
              </div>
              
              <div className="row-actions">
                <button className="btn-primary" style={{ padding: '8px 24px' }} onClick={(e) => { e.stopPropagation(); navigate(`/market/${m.marketId}`); }}>
                  View Markets
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export const MarketDetailsPage: React.FC = () => {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const { markets, fetchMarkets, setSelectedMarket } = useMarketOutlet();
  
  const market = markets.find(m => m.marketId === id);

  useEffect(() => {
    if (!market && markets.length === 0) {
      fetchMarkets();
    }
  }, [id, markets.length, fetchMarkets]);

  if (!market) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <RefreshCw size={48} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>Loading market details...</h4>
      </div>
    );
  }

  return (
    <section>
      <button 
        onClick={() => navigate('/')} 
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}
      >
        <ArrowLeft size={18} />
        Back to Discover
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px', marginBottom: '32px' }}>
            <div className="event-block event-a">
              <div className="event-label">TRIGGER EVENT (A)</div>
              <h1 className="event-title" style={{ fontSize: '24px' }}>{market.descriptionA}</h1>
            </div>
            <div className="event-arrow">
              <ArrowLeft size={24} style={{ transform: 'rotate(180deg)' }} />
            </div>
            <div className="event-block event-b">
              <div className="event-label">TARGET OUTCOME (B)</div>
              <h1 className="event-title" style={{ fontSize: '24px' }}>{market.descriptionB}</h1>
            </div>
          </div>
          
          <WorkflowVisualizer market={market} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Event A Market</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pool Liq: {market.totalLiquidityA} ETH</div>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ color: 'var(--success)' }}>YES {market.aYesOdds.toFixed(1)}%</span>
               <span style={{ color: 'var(--error)' }}>NO {market.aNoOdds.toFixed(1)}%</span>
             </div>
             <div style={{ height: '12px', background: 'var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '24px' }}>
               <div style={{ width: `${market.aYesOdds}%`, background: 'var(--success)' }}></div>
               <div style={{ width: `${market.aNoOdds}%`, background: 'var(--error)' }}></div>
             </div>
             
             <button className="btn-primary" style={{ width: '100%' }} onClick={() => setSelectedMarket(market, true)}>
               Trade Event A
             </button>
          </div>

          <div className="glass-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Event B Market</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pool Liq: {market.totalLiquidityB} ETH</div>
             </div>
             
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ color: 'var(--success)' }}>YES {market.bYesOdds.toFixed(1)}%</span>
               <span style={{ color: 'var(--error)' }}>NO {market.bNoOdds.toFixed(1)}%</span>
             </div>
             <div style={{ height: '12px', background: 'var(--border-subtle)', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '24px' }}>
               <div style={{ width: `${market.bYesOdds}%`, background: 'var(--success)' }}></div>
               <div style={{ width: `${market.bNoOdds}%`, background: 'var(--error)' }}></div>
             </div>
             
             <button className="btn-primary" style={{ width: '100%', background: 'var(--accent-secondary)' }} onClick={() => setSelectedMarket(market, false)}>
               Trade Event B
             </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export const PositionsPage: React.FC = () => {
  const { account } = useWeb3();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPositions = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const fallbackProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const service = new MarketService(fallbackProvider, REGISTRY_ADDR, ENGINE_ADDR);
      const userPos = await service.getUserPositions(account);
      setPositions(userPos);
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [account]);

  if (!account) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>Connect your wallet to view positions</h4>
      </div>
    );
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '32px' }}>My Positions (Four-Way)</h1>
        </div>
        <button className="btn-secondary" onClick={fetchPositions}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : positions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <TrendingUp size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h4 style={{ color: 'var(--text-secondary)' }}>No active positions</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Your trades will appear here once executed.</p>
          <button className="btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>Explore Markets</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {positions.map((p) => (
            <div key={p.marketId} className="glass-card list-row" onClick={() => navigate(`/market/${p.marketId}`)}>
              <div className="row-content" style={{ flex: 1 }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div className="event-block event-a" style={{ padding: '8px 12px' }}>
                     <h4 className="event-title" style={{ fontSize: '14px' }}>A: {p.descriptionA}</h4>
                  </div>
                  <ArrowLeft size={14} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }} />
                  <div className="event-block event-b" style={{ padding: '8px 12px' }}>
                     <h4 className="event-title" style={{ fontSize: '14px' }}>B: {p.descriptionB}</h4>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>EVENT A HOLDINGS</div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {Number(p.aYesShares) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                            <TrendingUp size={14} />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>YES: {Number(p.aYesShares).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(p.aNoShares) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)' }}>
                            <TrendingDown size={14} />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>NO: {Number(p.aNoShares).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(p.aYesShares) === 0 && Number(p.aNoShares) === 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                        )}
                      </div>
                  </div>

                  <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>EVENT B HOLDINGS</div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        {Number(p.bYesShares) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)' }}>
                            <TrendingUp size={14} />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>YES: {Number(p.bYesShares).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(p.bNoShares) > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)' }}>
                            <TrendingDown size={14} />
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>NO: {Number(p.bNoShares).toFixed(2)}</span>
                          </div>
                        )}
                        {Number(p.bYesShares) === 0 && Number(p.bNoShares) === 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                        )}
                      </div>
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className={`badge ${p.state === 0 ? 'badge-active' : p.state === 1 ? 'badge-monitoring' : 'badge-settled'}`}>
                    {p.state === 0 ? 'Monitoring A' : p.state === 1 ? 'Monitoring B' : 'Settled'}
                </span>
                <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={(e) => { e.stopPropagation(); navigate(`/market/${p.marketId}`); }}>
                  View Markets
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export const AppLayout: React.FC = () => {
  const { provider } = useWeb3();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<{market: MarketData, isEventA: boolean} | null>(null);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const fallbackProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const service = new MarketService(fallbackProvider, REGISTRY_ADDR, ENGINE_ADDR);
      const data = await service.fetchMarkets();
      setMarkets(data);
    } catch (error: any) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, [provider]);

  const lastEventTimestamp = markets.length > 0 
    ? Math.max(...markets.map(m => m.createdAt || 0)) 
    : null;

  const handleSetSelectedMarket = (market: MarketData | null, isEventA: boolean = true) => {
    setSelectedMarket(market ? { market, isEventA } : null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-darker)' }}>
      <Navbar lastEventTimestamp={lastEventTimestamp} />
      
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 40px', position: 'relative', zIndex: 1 }}>
         <Outlet context={{ markets, loading, fetchMarkets, setSelectedMarket: handleSetSelectedMarket } satisfies ContextType} />
      </main>

      {selectedMarket && (
        <TradeModal 
          market={selectedMarket.market}
          isEventA={selectedMarket.isEventA}
          onClose={() => setSelectedMarket(null)}
          onSuccess={() => { fetchMarkets(); setSelectedMarket(null); }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Web3Provider>
      <AppLayout />
    </Web3Provider>
  );
};

export default App;
