import * as dotenv from "dotenv";
import { ethers } from "ethers";
import { WorkflowOrchestrator, WorkflowConfig } from "./WorkflowOrchestrator";
import { EventMonitor } from "./EventMonitor";
import { StateManager } from "./StateManager";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pinataSDK from "@pinata/sdk";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ABIs
const REGISTRY_ABI = [
  "function listMarkets(uint8 stateFilter, uint256 offset, uint256 limit) external view returns (tuple(bytes32 marketId, address creator, string ipfsHash, address creWorkflowAddress, uint8 state, uint256 createdAt, uint256 expiresAt)[])",
  "function getMarketCount() external view returns (uint256)",
  "function createMarket(string ipfsHash, uint256 monitoringDuration, uint256 initialLiquidity) external payable returns (bytes32)"
];

/**
 * SERVICE 1: AI MARKET GENERATOR
 * Periodically creates new markets based on real-world news
 */
async function fetchTopNews(): Promise<string> {
  console.log("📰 [Generator] Fetching latest global news headlines from Reddit...");
  try {
    const response = await fetch('https://www.reddit.com/r/worldnews/top.json?limit=15&t=day', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Generator] News API error (${response.status}):`, errorText.slice(0, 200));
      throw new Error(`News API responded with status ${response.status}`);
    }

    const data: any = await response.json();
    if (!data.data || !data.data.children) {
      throw new Error("Unexpected Reddit API response structure");
    }

    const headlines = data.data.children.map((post: any, index: number) => {
      return `${index + 1}. Title: ${post.data.title}\n   Source URL: ${post.data.url}`;
    });
    return headlines.join('\n\n');
  } catch (error) {
    console.error("❌ [Generator] Failed to fetch news:", error);
    throw new Error("Could not retrieve news headlines.");
  }
}

async function generateAndDeployMarket() {
  console.log("\n🤖 [Generator] Starting AI Autonomous Market Generation cycle...");
  const aiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!aiKey) return console.error("❌ Missing GEMINI_API_KEY");

  const FALLBACK_MARKET = {
    marketTitle: "Middle East Supply Chain Disruption",
    eventA: {
      description: "Any drone strike is reported in the Red Sea shipping corridor within the next 4 hours.",
      dataSource: "https://www.reuters.com/world/middle-east/",
      aiCondition: "A confirmed kinetic military event or drone interception occurs in the Red Sea."
    },
    eventB: {
      description: "Brent Crude Oil price increases by more than 3% from its current level before 4 PM.",
      dataSource: "https://www.bloomberg.com/markets/commodities",
      aiCondition: "The price of Brent Crude as reported by Bloomberg closes up 3% or more today."
    }
  };

  try {
    const news = await fetchTopNews();
    const genAI = new GoogleGenerativeAI(aiKey);
    const prompt = `Identify one major news story and invent a highly logical "Domino Effect" prediction market JSON. The market MUST have a very short deadline and be resolvable TODAY (e.g., within the next 1-2 hours, before 3 PM).
    {
      "marketTitle": "Name",
      "eventA": { "description": "Desc with today's short deadline", "dataSource": "URL", "aiCondition": "Sentence" },
      "eventB": { "description": "Desc with today's short deadline", "dataSource": "URL", "aiCondition": "Sentence" }
    }
    Headlines: ${news}`;

    let marketConfig;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let jsonString = response.text() || "";
      // Robust JSON extraction: look for the first { and last }
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      marketConfig = JSON.parse(jsonString);
    } catch (aiErr: any) {
      console.error("❌ [Generator] AI Generation Error Details:", {
        message: aiErr.message,
        status: aiErr.status,
        details: aiErr.details
      });
      console.warn("⚠️ [Generator] Using Fallback Market due to error...");
      marketConfig = { ...FALLBACK_MARKET };
      // Add a unique identifier to prevent IPFS CID duplication and visual confusion
      const salt = Math.floor(Math.random() * 9999);
      marketConfig.marketTitle = `${marketConfig.marketTitle} #${salt}`;
    }

    // Add a tiny bit of random data to ensure a unique IPFS hash every time
    (marketConfig as any).generation_salt = Date.now();

    console.log("✅ [Generator] Market Prepared:", marketConfig.marketTitle);

    let ipfsHash = "QmMockHashForLocalTesting1234567890";
    const pinataKey = process.env.PINATA_API_KEY;
    const pinataSecret = process.env.PINATA_API_SECRET;

    if (pinataKey && pinataSecret) {
      console.log("📤 [Generator] Uploading to Pinata...");
      const pinata = new pinataSDK(pinataKey, pinataSecret);
      const res = await pinata.pinJSONToIPFS(marketConfig, { pinataMetadata: { name: marketConfig.marketTitle } });
      ipfsHash = res.IpfsHash;
      console.log(`📌 [Generator] IPFS CID: ${ipfsHash}`);
    }

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const walletKey = (process.env.PRIVATE_KEY || "").trim();
    const deployer = new ethers.Wallet(walletKey, provider);
    const registry = new ethers.Contract(process.env.MARKET_REGISTRY_ADDRESS || "", REGISTRY_ABI, deployer);

    const initialLiquidity = ethers.parseEther("0.01");
    const monitoringDuration = 86400; // 24 hours

    console.log(`🚀 [Generator] Deploying Market to Sepolia...`);
    const tx = await registry.createMarket(ipfsHash, monitoringDuration, initialLiquidity, { value: initialLiquidity });
    await tx.wait();
    console.log(`✅ [Generator] Market deployed! Hash: ${tx.hash}`);

  } catch (error) {
    console.error("❌ [Generator] Failed:", error);
  }
}

const metadataCache = new Map<string, any>();

/**
 * SERVICE 2: MARKET RUNNER
 * Scans Sepolia for active markets and processes them
 */
async function runOrchestrationLoop() {
  console.log(`\n🔍 [Runner] Scanning Sepolia for active markets...`);
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const registry = new ethers.Contract(process.env.MARKET_REGISTRY_ADDRESS || "", REGISTRY_ABI, provider);
  const monitor = new EventMonitor();
  const stateManager = new StateManager(process.env.WORKFLOW_STATE_PATH || "./workflow_state");
  const workflowSigner = new ethers.Wallet((process.env.PRIVATE_KEY || "").trim(), provider);
  const orchestrator = new WorkflowOrchestrator(workflowSigner, monitor);

  try {
    const activeMarkets = await registry.listMarkets(0, 0, 50);
    const monitoringBMarkets = await registry.listMarkets(1, 0, 50);
    const allMarkets = [...activeMarkets, ...monitoringBMarkets];

    console.log(`Found ${allMarkets.length} markets to process.`);

    for (const m of allMarkets) {
      const marketId = m.marketId;
      // console.log(`Processing ${marketId}...`);

      let config: WorkflowConfig;
      if (m.ipfsHash && m.ipfsHash !== "QmMockHashForLocalTesting1234567890") {
        try {
          let json: any;
          if (metadataCache.has(m.ipfsHash)) {
          // console.log(`📦 [Runner] Using cached metadata for ${m.ipfsHash}`);
            json = metadataCache.get(m.ipfsHash);
          } else {
            console.log(`🌐 [Runner] Fetching fresh metadata for ${m.ipfsHash}`);
            const res = await fetch(`https://gateway.pinata.cloud/ipfs/${m.ipfsHash}`);
            if (!res.ok) {
              console.warn(`⚠️ [Runner] IPFS fetch failed for ${m.ipfsHash}: ${res.status}`);
              continue;
            }
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn(`⚠️ [Runner] IPFS response for ${m.ipfsHash} is not JSON: ${contentType}`);
              continue;
            }
            json = await res.json();
            metadataCache.set(m.ipfsHash, json);
          }

          config = {
            marketId,
            eventADefinition: { description: json.eventA.description, dataSources: [json.eventA.dataSource], detectionCriteria: { type: "AI_ORACLE", condition: json.eventA.aiCondition }, consensusThreshold: 0.67 },
            eventBDefinition: { description: json.eventB.description, dataSources: [json.eventB.dataSource], detectionCriteria: { type: "AI_ORACLE", condition: json.eventB.aiCondition }, monitoringDuration: 86400, consensusThreshold: 0.67 },
            contractAddress: process.env.SETTLEMENT_MANAGER_ADDRESS || "",
            pollIntervalSeconds: 600,
            expiresAt: Number(m.expiresAt) * 1000,
            createdAt: Number(m.createdAt)
          };
        } catch (fetchErr) {
          console.error(`❌ [Runner] Error processing market ${marketId}:`, fetchErr);
          continue;
        }
      } else {
          continue; // Skip mock markets in production
      }

      let state = await stateManager.loadState(marketId);
      if (!state) {
        state = { marketId, phase: m.state === 0 ? "MONITORING_EVENT_A" : "MONITORING_EVENT_B", eventAOccurred: m.state > 0, eventBOccurred: false, eventBHighestValue: 0, lastPollTime: 0, retryCount: 0, isPaused: false };
      }

      const nextState = await orchestrator.execute(state, config);
      await stateManager.saveState(marketId, nextState);
    }
  } catch (error) {
    console.error("❌ [Runner] Loop Error:", error);
  }
}

/**
 * MAIN ENTRY POINT
 */
async function start() {
  console.log("==========================================");
  console.log("🌍 Domino Effect CRE Backend Starting...");
  console.log("==========================================");

  // 1. Initial run
  await runOrchestrationLoop();
  await generateAndDeployMarket();

  // 2. Set intervals for rapid demo (Updated: 30-min generation, 10-min poll)
  setInterval(runOrchestrationLoop, 10 * 60 * 1000); // Poll every 10 min
  setInterval(generateAndDeployMarket, 30 * 60 * 1000); // Generate every 30 mins
}

start().catch(console.error);
