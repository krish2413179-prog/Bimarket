# 🏦 Domino Effect: Advanced 4-Way Prediction Markets

**Domino Effect** is a next-generation decentralized prediction market built on Ethereum (Sepolia) and powered by Chainlink. Unlike traditional binary markets, Domino Effect implements a **Dual-AMM (Automated Market Maker)** architecture, allowing users to trade on the cascading outcomes of two independent events (Event A and Event B).

![Domino Effect Banner](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop)

## 🌟 Key Features

### 1. Dual-AMM Architecture
Domino Effect separates liquidity into independent pools for Event A and Event B. This allows:
- **Independent Pricing:** Trade on whether A happens, AND independently on whether B happens given A.
- **Cascading Outcomes:** Calculate 4 distinct outcome combinations (A causes B, A happens but B doesn't, etc.).
- **Efficient Liquidity:** Higher capital efficiency than standard multi-token AMMs.

### 2. AI-Autonomous Market Generation
Powered by **Gemini 2.5 Flash Lite**, the platform:
- Scans global news headlines automatically every 10 minutes.
- Synthesizes logical "Domino Effect" scenarios.
- Deploys new markets to the blockchain without human intervention.

### 3. Chainlink Oracles & Settlement
Uses Chainlink Functions and custom AI Oracle logic to:
- Monitor real-world data sources (Bloomberg, Reuters, Maritime APIs).
- Verify event outcomes with high precision.
- Trigger automatic payouts to winners.

---

## 🏗️ Architecture

- **`TradingEngine.sol`**: Manages the Dual-AMM pools and swap logic.
- **`MarketRegistry.sol`**: Central registry for all AI-generated markets.
- **`SettlementManager.sol`**: Logic for independent event verification and payout distribution.
- **`CRE Backend`**: The Node.js "Brain" that manages news ingestion, AI synthesis, and orchestration.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Hardhat / Foundry
- Sepolia ETH (for trading/deployment)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/krish2413179-prog/Domino-market.git
   cd Domino-market
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env` and fill in:
   - `PRIVATE_KEY` (Sepolia wallet)
   - `GEMINI_API_KEY`
   - `PINATA_JWT` / `PINATA_API_KEY` (for IPFS metadata)

### Running the Platform

**Start the Backend (AI Generator & Runner):**
```bash
npm run cre:backend
```

**Start the Frontend:**
```bash
cd frontend && npm run dev
```

---

## 🎨 Design Philosophy
Domino Effect uses a **Cyber-Premium** aesthetic, featuring:
- Glassmorphism UI components.
- Real-time countdown timers for market drops.
- Dynamic odds visualization for Event A and Event B.

---

## Deployed Link
https://bimarket-nu.vercel.app/
