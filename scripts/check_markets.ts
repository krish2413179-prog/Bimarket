import { ethers } from "hardhat";
  
async function main() {
  const registryAddress = "0x5a5b785f9f5Ed61f0A839a6CABBaB029b4Ba2C8B";
  const Registry = await ethers.getContractAt("MarketRegistry", registryAddress);
  const count = await Registry.getMarketCount();
  console.log("MARKET_COUNT=" + count.toString());
}

main().catch(console.error);
