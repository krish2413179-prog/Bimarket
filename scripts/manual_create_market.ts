import { ethers } from "ethers";

const REGISTRY_ADDR = "0x5a5b785f9f5Ed61f0A839a6CABBaB029b4Ba2C8B";
const ABI = [
  "function createMarket(string marketTitle, string eventA, string eventB, string ipfsCid) external returns (bytes32 marketId)",
  "function getMarketCount() external view returns (uint256)"
];

async function main() {
  const pk = "4f2f402e4fa4fe0b24025ac812e7ff84118b80239728baebe5866795c560fa01";
  const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
  const wallet = new ethers.Wallet(pk, provider);
  const registry = new ethers.Contract(REGISTRY_ADDR, ABI, wallet);

  console.log("Creating market...");
  try {
    const tx = await registry.createMarket(
      "Initial Market",
      "Event A Description",
      "Event B Description",
      "QmWhLd5Pt6XpXdvwBFaMmrn9FtcxGLjyiV5AzyhR2xyB5A"
    );
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("Market created!");
    const count = await registry.getMarketCount();
    console.log("New count:", count.toString());
  } catch (err) {
    console.error("Error creating market:", err);
  }
}

main();
