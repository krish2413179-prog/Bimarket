import React from 'react';
import { ArrowLeft, BookOpen, Cpu, Shield, Zap, Layers, GitBranch, Database, Link2, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Section: React.FC<{ icon: React.ReactNode; number: string; title: string; color?: string; children: React.ReactNode }> = ({ icon, number, title, color = 'var(--accent-primary)', children }) => (
  <div className="glass-card" style={{ padding: '40px', marginBottom: '28px' }}>
    <h2 style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', fontSize: '22px' }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 700 }}>{number}</span>
      {title}
    </h2>
    {children}
  </div>
);

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre style={{
    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-subtle)',
    borderRadius: '10px', padding: '20px 24px', fontSize: '13px', lineHeight: 1.7,
    color: '#a8d8ea', overflow: 'auto', margin: '16px 0', fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
  }}>
    <code>{children}</code>
  </pre>
);

const Tag: React.FC<{ label: string; color?: string }> = ({ label, color = 'var(--accent-primary)' }) => (
  <span style={{
    display: 'inline-block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
    color, background: `${color}12`, border: `1px solid ${color}30`,
    borderRadius: '4px', padding: '3px 10px', marginRight: '8px', marginBottom: '6px'
  }}>{label}</span>
);

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.12)',
    borderLeft: '3px solid var(--accent-primary)', borderRadius: '0 8px 8px 0',
    padding: '16px 20px', margin: '16px 0', fontSize: '14px',
    color: 'var(--text-secondary)', lineHeight: 1.7
  }}>{children}</div>
);

export const WhitepaperPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}
      >
        <ArrowLeft size={18} /> Back to App
      </button>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '72px' }}>
        <div style={{
          display: 'inline-flex', padding: '8px 24px', background: 'rgba(14, 165, 233, 0.05)',
          borderRadius: '30px', border: '1px solid rgba(14, 165, 233, 0.2)', color: 'var(--accent-primary)',
          fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '28px', alignItems: 'center', gap: '8px'
        }}>
          <BookOpen size={14} /> PROTOCOL WHITEPAPER v1.0
        </div>
        <h1 style={{ fontSize: '52px', marginBottom: '20px', lineHeight: 1.08 }}>Bimarket<br />Domino Protocol</h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          An autonomous prediction market engine powered by <strong>Chainlink CRE</strong>, <strong>Gemini AI</strong>,
          and a causal "Domino Effect" market structure where Event B can only resolve if Event A first fires.
        </p>
        <div style={{ marginTop: '28px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Tag label="Chainlink CRE" color="var(--accent-primary)" />
          <Tag label="Sepolia Testnet" color="var(--accent-secondary)" />
          <Tag label="Gemini 2.5 Flash" color="#f59e0b" />
          <Tag label="IPFS / Pinata" color="#10b981" />
          <Tag label="AMM-based Trading" color="var(--accent-tertiary)" />
        </div>
      </div>

      {/* 1. CRE */}
      <Section number="01" title="Chainlink CRE Integration" icon={<Cpu size={22} />} color="var(--accent-primary)">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          Chainlink's <strong>Coprocessor Runtime Environment (CRE)</strong> is a decentralized compute layer that runs off-chain
          logic and writes cryptographically verified results back to a smart contract via the <strong>Keystone Forwarder</strong>.
          In Bimarket, the CRE workflow runs on a cron trigger and acts as the autonomous "brain" of the protocol —
          fetching news, generating markets, uploading metadata, and registering them on-chain without any human input.
        </p>

        <Highlight>
          The CRE is not an ordinary oracle. It executes full TypeScript programs inside a decentralized off-chain compute
          network, signs the output as a DON (Decentralized Oracle Network) consensus report, and delivers it to a designated
          receiver contract via the Keystone Forwarder at{' '}
          <code style={{ color: 'var(--accent-primary)' }}>0x15fC6ae953E024d975e77382eEeC56A9101f9F88</code>.
        </Highlight>

        <h3 style={{ marginTop: '28px', marginBottom: '12px', fontSize: '16px' }}>Workflow File Structure</h3>
        <CodeBlock>{`workflows/
├── main.ts          # Core workflow logic (cron → AI → IPFS → on-chain)
├── workflow.yaml    # Capability declarations (cron, http, evm)
├── project.yaml     # Network targets and DON configuration
├── settings.yaml    # RPC endpoints and chain selectors
└── config.staging.json  # Environment-specific config (registry address, API keys)`}
        </CodeBlock>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px' }}>Declared Capabilities (<code>workflow.yaml</code>)</h3>
        <CodeBlock>{`capabilities:
  - id: cron-trigger@1.0.0         # Triggers workflow on a schedule
  - id: http@1.0.0                 # Fetches news + calls Gemini API + Pinata
  - id: evm@1.0.0                  # Writes the market creation report on Sepolia`}
        </CodeBlock>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px' }}>How <code>writeReport</code> Works</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          After generating market data, the workflow encodes a <code>createMarket()</code> call using <code>encodeFunctionData</code>.
          This ABI-encoded payload is submitted as a CRE report using <code>evmClient.writeReport()</code>.
          The Chainlink DON collects signatures from multiple nodes, and the Keystone Forwarder on-chain verifies the quorum
          before calling <code>onReport()</code> on the <code>MarketRegistry</code>.
        </p>
        <CodeBlock>{`// workflows/main.ts (simplified)
const encodedPayload = encodeFunctionData({
  abi: MARKET_REGISTRY_ABI,
  functionName: 'createMarket',
  args: [marketTitle, eventA, eventB, ipfsCid],
});

const evmClient = new EVMClient(ChainSelector['ethereum-testnet-sepolia']);
evmClient.writeReport(nodeRuntime, {
  receiver: hexToBytes(marketRegistryAddress),
  report: { id: reportId, encodedPayload },
});`}
        </CodeBlock>
      </Section>

      {/* 2. onReport Receiver */}
      <Section number="02" title="MarketRegistry — onReport Receiver" icon={<Code2 size={22} />} color="var(--accent-secondary)">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          The <code>MarketRegistry.sol</code> contract implements the <strong>CRE Report Receiver</strong> interface.
          When the Keystone Forwarder delivers a verified report, it calls <code>onReport(bytes metadata, bytes report)</code>.
          The contract re-executes the report bytes as a direct call to itself, which invokes <code>createMarket()</code>.
        </p>
        <CodeBlock>{`// contracts/MarketRegistry.sol
address public keystoneForwarder = 0x15fC6ae953E024d975e77382eEeC56A9101f9F88;
uint256 public seedAmount = 0.01 ether;  // auto-seeded into each market pool

function onReport(bytes calldata /* metadata */, bytes calldata report) external {
    require(msg.sender == keystoneForwarder, "Only Keystone Forwarder");
    (bool success, bytes memory returnData) = address(this).call(report);
    if (!success) { /* bubble up revert */ }
}

function createMarket(
    string memory marketTitle,
    string memory eventA,
    string memory eventB,
    string memory ipfsCid
) external returns (bytes32 marketId) {
    // Generate unique ID, store market metadata, push to registry...
    // Auto-seed the trading pool from contract ETH reserve
    uint256 seed = (seedAmount > 0 && address(this).balance >= seedAmount)
        ? seedAmount : 0;
    if (seed > 0) {
        tradingEngine.initializePool{value: seed}(marketId, seed);
    }
    emit MarketCreated(marketId, msg.sender, createdAt, expiresAt);
}`}
        </CodeBlock>
        <Highlight>
          The registry contract is funded with a <strong>0.5 ETH reserve</strong> deposited via <code>depositLiquidity()</code>.
          This reserve auto-seeds each new AI-created market with <strong>0.01 ETH</strong> of AMM liquidity — enough
          for users to immediately start trading without any manual initialization.
        </Highlight>
      </Section>

      {/* 3. Domino Architecture */}
      <Section number="03" title={`The "Domino Effect" Market Structure`} icon={<Layers size={22} />} color="var(--accent-tertiary)">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
          Unlike single-event prediction markets, Bimarket tracks <strong>causal chains</strong>. Each market has two predictions:
          a <strong>Trigger</strong> (Event A) and a <strong>Consequence</strong> (Event B). Event B is defined in a way that makes
          it only resolvable <em>after</em> Event A is confirmed.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[
            { phase: 'Phase 1', label: 'Monitoring A', color: 'var(--accent-primary)', desc: 'The CRE workflow continuously monitors global news for the Trigger Event. AMM pools are open for trading. If Event A never occurs before the market deadline, all positions expire worthless.' },
            { phase: 'Phase 2', label: 'Monitoring B', color: 'var(--accent-secondary)', desc: 'Once Event A is verified by the CRE DON and written on-chain, the MarketRegistry state advances. A new timer begins for Event B. Traders who bet "YES on A→B" are now in the money contingent on B.' },
          ].map(({ phase, label, color, desc }) => (
            <div key={phase} style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: `1px solid ${color}30` }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color, letterSpacing: '0.1em', marginBottom: '6px' }}>{phase}</div>
              <h4 style={{ marginBottom: '10px', fontSize: '15px' }}>{label}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '16px' }}>Gemini AI Prompt Design</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          The CRE workflow uses a structured Gemini prompt that enforces causal dependency. The prompt explicitly requires:
          (1) Event A resolvable in 7–30 days, (2) Event B resolvable 30–90 days <em>after A</em>, and
          (3) concrete, binary, verifiable thresholds — no vague language like "market reacts."
        </p>
        <CodeBlock>{`// Example AI-generated Domino market
Market:  "Amazon Unionization Push Spurs Big Tech Unionization Bid"
Event A: "Amazon unionization achieves formal recognition with CBAs signed
          representing at least 50,000 employees within 30 days"
Event B: "Employee orgs from Amazon, Google, and Microsoft jointly demand
          union recognition within 60 days of Event A's resolution"`}
        </CodeBlock>
      </Section>

      {/* 4. Smart Contract Architecture */}
      <Section number="04" title="Smart Contract Architecture" icon={<Database size={22} />} color="#10b981">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          The protocol is composed of three Solidity contracts deployed on <strong>Ethereum Sepolia</strong>:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              name: 'MarketRegistry.sol',
              addr: '0x90959444AeDfd16189423DA428144Cf29845a382',
              color: 'var(--accent-primary)',
              desc: 'Stores all market metadata (IPFS CID, state, timestamps). Receives CRE reports via onReport(), auto-seeds pools, tracks market lifecycle. Holds ETH reserve for liquidity seeding.'
            },
            {
              name: 'TradingEngine.sol',
              addr: '0x93e6B0485D27de04dCA0E2b48a73CC289a9c5245',
              color: 'var(--accent-secondary)',
              desc: 'Implements a constant-product AMM (x·y=k) for both Event A and Event B pools. Handles buyPosition(), sellPosition(), calculateShares(), and payout distribution. Holds all user ETH.'
            },
            {
              name: 'SettlementManager.sol',
              addr: '0xc36B68Ce035A307d5322eDCcF888E9479337DB8F',
              color: '#10b981',
              desc: 'Called by the CRE when a market is ready to settle. Verifies the DON-signed outcome, transitions the MarketRegistry state to Settled, and triggers payouts to winning share-holders.'
            },
          ].map(({ name, addr, color, desc }) => (
            <div key={name} style={{ background: 'var(--bg-dark)', padding: '20px 24px', borderRadius: '12px', border: `1px solid ${color}25`, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <code style={{ fontSize: '14px', fontWeight: 700, color }}>{name}</code>
                <a href={`https://sepolia.etherscan.io/address/${addr}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}
                  onClick={e => e.stopPropagation()}
                >{addr.slice(0, 6)}…{addr.slice(-4)} ↗</a>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. End-to-End Flow */}
      <Section number="05" title="End-to-End Flow" icon={<GitBranch size={22} />} color="#f59e0b">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
          Every 15 minutes, the full autonomous loop executes:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { n: '1', label: 'Cron Trigger fires', desc: 'The CRE worker wakes up on schedule (cron-trigger@1.0.0).' },
            { n: '2', label: 'Fetch News', desc: 'The workflow fetches real-time global headlines via the NewsAPI HTTP capability.' },
            { n: '3', label: 'Gemini AI Generation', desc: 'Headlines are sent to Gemini 2.5 Flash with a structured Domino Effect prompt. The model returns a JSON with marketTitle, eventA, eventB.' },
            { n: '4', label: 'IPFS Upload', desc: 'The full market metadata is pinned to IPFS via Pinata, returning a CID used as the permanent content address.' },
            { n: '5', label: 'writeReport → on-chain', desc: 'The workflow encodes createMarket() calldata and calls evmClient.writeReport(). The Chainlink DON aggregates signatures and the Keystone Forwarder delivers the report to MarketRegistry.onReport().' },
            { n: '6', label: 'Auto-Seed Pool', desc: 'createMarket() draws 0.01 ETH from the registry\'s reserve and initializes a constant-product AMM pool in TradingEngine via initializePool().' },
            { n: '7', label: 'Frontend Display', desc: 'The React frontend reads all markets from MarketRegistry.getMarketCount() and marketIds[] sorted newest-first, fetches IPFS metadata, and renders the Trigger → Consequence layout.' },
          ].map(({ n, label, desc }, i, arr) => (
            <div key={n} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#000', flexShrink: 0
                }}>{n}</div>
                {i < arr.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />}
              </div>
              <div style={{ paddingBottom: i < arr.length - 1 ? '20px' : '0' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Security */}
      <Section number="06" title="Security & Trust Model" icon={<Shield size={22} />} color="var(--success)">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
          The CRE model provides stronger security guarantees than a centralized oracle:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            ['DON Consensus', 'Multiple independent Chainlink nodes must agree on the report content. No single node can forge a report.'],
            ['Keystone Forwarder Verification', 'The MarketRegistry\'s onReport() is gated behind require(msg.sender == keystoneForwarder). Only the Chainlink Forwarder can call it.'],
            ['Immutable AMM Rules', 'Trading logic in TradingEngine.sol enforces constant-product invariant (x·y=k). No admin can manipulate prices or drain pools.'],
            ['IPFS Content Addressing', 'Market definitions are stored on IPFS with a CID. The CID is written on-chain, making the market definition tamper-proof and permanently verifiable.'],
            ['Report Payload Integrity', 'The encodedPayload is ABI-encoded createMarket() calldata. The contract re-executes only what was signed by the DON — it cannot be modified mid-flight.'],
          ].map(([title, desc]) => (
            <div key={title as string} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', marginTop: '7px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}: </span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Autonomous Generation */}
      <Section number="07" title="Autonomous Market Generation" icon={<Zap size={22} />} color="#f59e0b">
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          Bimarket is fully self-sustaining. The CRE workflow runs on a scheduled cron trigger — no human needs to
          create, approve, or deploy markets. The only human-operated action is maintaining the ETH reserve in the
          MarketRegistry contract (via <code>depositLiquidity()</code>) to ensure new markets are auto-seeded.
        </p>
        <Highlight>
          <strong>Capacity:</strong> The registry currently holds <strong>0.5 ETH</strong> — enough to
          auto-generate and seed <strong>50 prediction markets</strong> at 0.01 ETH each.
          The <code>updateSeedAmount()</code> function lets the owner adjust the per-market seed as the protocol scales.
        </Highlight>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          This makes Bimarket a next-generation prediction market — not just a dApp, but a fully autonomous,
          AI-driven financial primitive powered by decentralized compute.
        </p>
      </Section>
    </section>
  );
};

export default WhitepaperPage;
