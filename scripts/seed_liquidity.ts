import { ethers } from "ethers";

const ENGINE_ADDR = "0x197c6c04a6257f1cc6Bfa0F8adf795f0edC62978";
const REGISTRY_ADDR = "0x23D6c7832D9ee75C43d75A4100e515ED688Ae7A4";

const ENGINE_ABI = [
  "function initializePool(bytes32 marketId, uint256 initialLiquidity) external payable",
  "function getPool(bytes32 marketId, bool isEventA) external view returns (tuple(uint256 yesReserve, uint256 noReserve, uint256 totalLiquidity))"
];

const REGISTRY_ABI = [
  "function getMarketCount() external view returns (uint256)",
  "function marketIds(uint256) external view returns (bytes32)"
];

async function main() {
  const pk = "4f2f402e4fa4fe0b24025ac812e7ff84118b80239728baebe5866795c560fa01";
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const wallet = new ethers.Wallet(pk, provider);

  const engine = new ethers.Contract(ENGINE_ADDR, ENGINE_ABI, wallet);
  const registry = new ethers.Contract(REGISTRY_ADDR, REGISTRY_ABI, wallet);

  const count = await registry.getMarketCount();
  console.log("Markets to seed:", count.toString());

  const SEED = ethers.parseEther("0.01"); // 0.01 ETH per market (split across A/B pools)

  for (let i = 0; i < Number(count); i++) {
    const marketId = await registry.marketIds(i);
    
    // Check if pool A already has liquidity
    const poolA = await engine.getPool(marketId, true);
    if (poolA.totalLiquidity > 0n) {
      console.log(`Market ${i} already seeded, skipping.`);
      continue;
    }

    console.log(`Seeding market ${i}: ${marketId}`);
    const tx = await engine.initializePool(marketId, SEED, { value: SEED });
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("Pool seeded successfully!");
    
    const newPoolA = await engine.getPool(marketId, true);
    console.log("Pool A liquidity:", ethers.formatEther(newPoolA.totalLiquidity), "ETH");
  }

  console.log("Done seeding pools.");
}

main().catch(console.error);
