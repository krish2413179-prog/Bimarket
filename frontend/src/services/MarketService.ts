import { ethers } from 'ethers';

const MARKET_REGISTRY_ABI = [
  "function listMarkets(uint8 stateFilter, uint256 offset, uint256 limit) external view returns (tuple(bytes32 marketId, address creator, string ipfsHash, address creWorkflowAddress, uint8 state, uint256 createdAt, uint256 expiresAt)[])",
  "function getMarket(bytes32 marketId) external view returns (tuple(bytes32 marketId, address creator, string ipfsHash, address creWorkflowAddress, uint8 state, uint256 createdAt, uint256 expiresAt))"
];

const TRADING_ENGINE_ABI = [
  "function getPool(bytes32 marketId, bool isEventA) external view returns (tuple(uint256 yesReserve, uint256 noReserve, uint256 totalLiquidity))",
  "function calculateShares(bytes32 marketId, bool isEventA, bool isYes, uint256 stakeAmount) public view returns (uint256)",
  "function buyPosition(bytes32 marketId, bool isEventA, bool isYes, uint256 stakeAmount) external payable returns (uint256)",
  "function getPosition(bytes32 marketId, bool isEventA, address user) external view returns (uint256 yesShares, uint256 noShares)"
];

export interface MarketData {
  marketId: string;
  creator: string;
  descriptionA: string;
  descriptionB: string;
  state: number;
  aYesOdds: number;
  aNoOdds: number;
  bYesOdds: number;
  bNoOdds: number;
  totalLiquidityA: string;
  totalLiquidityB: string;
  createdAt: number;
}

export interface UserPosition {
  marketId: string;
  descriptionA: string;
  descriptionB: string;
  aYesShares: string;
  aNoShares: string;
  bYesShares: string;
  bNoShares: string;
  state: number;
}

export class MarketService {
  private registry: ethers.Contract;
  private engine: ethers.Contract;

  constructor(
    provider: ethers.Provider | ethers.Signer,
    registryAddress: string,
    engineAddress: string
  ) {
    this.registry = new ethers.Contract(registryAddress, MARKET_REGISTRY_ABI, provider);
    this.engine = new ethers.Contract(engineAddress, TRADING_ENGINE_ABI, provider);
  }

  async fetchMarkets(limit = 20): Promise<MarketData[]> {
    try {
      const [activeRaw, monitoringBRaw] = await Promise.all([
        this.registry.listMarkets(0, 0, limit),
        this.registry.listMarkets(1, 0, limit)
      ]);
      
      const rawMarkets = [...activeRaw, ...monitoringBRaw];
      
      const markets = (await Promise.all(rawMarkets.map(async (m: any) => {
        let descA = "Loading Event Data...";
        let descB = "Loading Event Data...";
        
        if (!m.ipfsHash || m.ipfsHash === "QmMockHashForLocalTesting1234567890") return null;

        try {
            const gateways = [
              `https://ipfs.io/ipfs/${m.ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${m.ipfsHash}`,
              `https://dweb.link/ipfs/${m.ipfsHash}`
            ];
            
            let json: any = null;
            for (const url of gateways) {
              try {
                const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
                if (res.ok) {
                  json = await res.json();
                  break; 
                }
              } catch (e) {
                continue;
              }
            }

            if (json) {
              descA = json.marketTitle ? `[${json.marketTitle}] ${json.eventA?.description || json.eventA}` : (json.eventA?.description || json.eventA || "Unknown Event A");
              descB = json.eventB?.description || json.eventB || "Unknown Event B";
            } else {
              return null; // Skip if metadata can't be fetched
            }
        } catch (e) {
            console.error("Failed to fetch IPFS CID:", m.ipfsHash, e);
            return null;
        }

        const poolA = await this.engine.getPool(m.marketId, true);
        const poolB = await this.engine.getPool(m.marketId, false);
        
        const aYes = Number(poolA.yesReserve);
        const aNo = Number(poolA.noReserve);
        const aTotal = aYes + aNo;
        
        const bYes = Number(poolB.yesReserve);
        const bNo = Number(poolB.noReserve);
        const bTotal = bYes + bNo;
        
        return {
          marketId: m.marketId,
          creator: m.creator,
          descriptionA: descA,
          descriptionB: descB,
          state: Number(m.state),
          aYesOdds: aTotal > 0 ? (aNo / aTotal) * 100 : 50,
          aNoOdds: aTotal > 0 ? (aYes / aTotal) * 100 : 50,
          bYesOdds: bTotal > 0 ? (bNo / bTotal) * 100 : 50,
          bNoOdds: bTotal > 0 ? (bYes / bTotal) * 100 : 50,
          totalLiquidityA: ethers.formatEther(poolA.totalLiquidity),
          totalLiquidityB: ethers.formatEther(poolB.totalLiquidity),
          createdAt: Number(m.createdAt) * 1000
        };
      }))).filter(m => m !== null) as MarketData[];

      return markets;
    } catch (error) {
      console.error("Error fetching markets:", error);
      throw error;
    }
  }

  async getUserPositions(userAddress: string): Promise<UserPosition[]> {
    try {
      const limit = 50;
      const [activeRaw, monitoringBRaw, settledRaw] = await Promise.all([
        this.registry.listMarkets(0, 0, limit),
        this.registry.listMarkets(1, 0, limit),
        this.registry.listMarkets(2, 0, limit)
      ]);
      
      const allMarkets = [...activeRaw, ...monitoringBRaw, ...settledRaw];
      
      const positions = await Promise.all(allMarkets.map(async (m: any) => {
        const posA = await this.engine.getPosition(m.marketId, true, userAddress);
        const posB = await this.engine.getPosition(m.marketId, false, userAddress);
        
        const aYes = BigInt(posA.yesShares);
        const aNo = BigInt(posA.noShares);
        const bYes = BigInt(posB.yesShares);
        const bNo = BigInt(posB.noShares);
        
        if (aYes === 0n && aNo === 0n && bYes === 0n && bNo === 0n) return null;
        
        let descA = "Loading...";
        let descB = "Loading...";
        
        if (!m.ipfsHash || m.ipfsHash === "QmMockHashForLocalTesting1234567890") return null;

        try {
            const gateways = [
              `https://ipfs.io/ipfs/${m.ipfsHash}`,
              `https://cloudflare-ipfs.com/ipfs/${m.ipfsHash}`,
              `https://dweb.link/ipfs/${m.ipfsHash}`
            ];
            
            let json: any = null;
            for (const url of gateways) {
              try {
                const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
                if (res.ok) {
                  json = await res.json();
                  break;
                }
              } catch (e) {
                continue;
              }
            }

            if (json) {
              descA = json.eventA?.description || json.eventA || "Unknown Event A";
              descB = json.eventB?.description || json.eventB || "Unknown Event B";
            }
        } catch (e) {
            console.error("Failed to fetch IPFS CID:", m.ipfsHash, e);
            return null;
        }
        
        return {
          marketId: m.marketId,
          descriptionA: descA,
          descriptionB: descB,
          aYesShares: ethers.formatUnits(aYes, 18),
          aNoShares: ethers.formatUnits(aNo, 18),
          bYesShares: ethers.formatUnits(bYes, 18),
          bNoShares: ethers.formatUnits(bNo, 18),
          state: Number(m.state)
        };
      }));
      
      return positions.filter(p => p !== null) as UserPosition[];
    } catch (error) {
      console.error("Error fetching user positions:", error);
      return [];
    }
  }

  async buyPosition(
    marketId: string, 
    isEventA: boolean,
    isYes: boolean, 
    amountEth: string
  ): Promise<string> {
    const value = ethers.parseEther(amountEth);
    const tx = await this.engine.buyPosition(marketId, isEventA, isYes, value, { value });
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
