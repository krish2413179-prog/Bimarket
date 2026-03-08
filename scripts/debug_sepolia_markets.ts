import { ethers } from "ethers";

const REGISTRY_ADDR = "0x23D6c7832D9ee75C43d75A4100e515ED688Ae7A4";
const ABI = [
  "function getMarketCount() external view returns (uint256)",
  "function marketIds(uint256) external view returns (bytes32)",
  "function markets(bytes32) external view returns (bytes32 marketId, address creator, string ipfsHash, address creWorkflowAddress, uint8 state, uint256 createdAt, uint256 expiresAt)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const registry = new ethers.Contract(REGISTRY_ADDR, ABI, provider);

  const count = await registry.getMarketCount();
  console.log("Total Markets:", count.toString());

  for (let i = 0; i < Number(count); i++) {
    const id = await registry.marketIds(i);
    const m = await registry.markets(id);
    console.log(`Market ${i}:`, { ipfsHash: m.ipfsHash, state: m.state.toString() });
  }
}

main();
