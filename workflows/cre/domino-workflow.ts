import {
  cre,
  ok,
  json,
  getNetwork,
  encodeCallMsg,
  prepareReportRequest,
  LAST_FINALIZED_BLOCK_NUMBER,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { z } from "zod";
import { encodeFunctionData, decodeFunctionResult, type Address, zeroAddress } from "viem";

const configSchema = z.object({
  schedule: z.string(),
  geminiApiKey: z.string(),
  pinataApiKey: z.string(),
  pinataApiSecret: z.string(),
  evm: z.object({
    chainSelectorName: z.string(),
    marketRegistryAddress: z.string(),
    engineAddress: z.string(),
  }),
});

type Config = z.infer<typeof configSchema>;

const REGISTRY_ABI = [
  {
    name: "createMarket",
    type: "function",
    inputs: [
      { name: "ipfsHash", type: "string" },
      { name: "monitoringDuration", type: "uint256" },
      { name: "initialLiquidity", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "payable",
  },
] as const;

const fetchNewsHeadlines = (sendRequester: HTTPSendRequester): string => {
  const fallback = [
    "Global AI investment accelerates as tech giants report record earnings.",
    "Central banks signal rate cut pivot amid cooling inflation data.",
    "Renewable energy adoption reaches historic milestone worldwide.",
    "Semiconductor supply chain diversification reshapes global trade.",
    "Middle East diplomatic talks progress; oil markets stabilize.",
  ].join("\n");

  const response = sendRequester
    .sendRequest({
      url: "https://www.reddit.com/r/worldnews/top.json?limit=10&t=day",
      method: "GET",
      headers: [
        {
          key: "User-Agent",
          value:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        },
        { key: "Accept", value: "application/json" },
      ],
    })
    .result();

  if (!ok(response)) {
    return fallback;
  }

  try {
    const data = json(response) as any;
    if (!data?.data?.children?.length) return fallback;
    return data.data.children
      .slice(0, 10)
      .map((p: any, i: number) => `${i + 1}. ${p.data.title}`)
      .join("\n");
  } catch {
    return fallback;
  }
};

const generateMarketWithGemini = (
  sendRequester: HTTPSendRequester,
  config: Config,
  headlines: string
): any => {
  const prompt = `You are a prediction market AI. Based on these news headlines, create a concise "Domino Effect" market JSON.
  
CRITICAL: Keep descriptions SHORT (max 15 words). Resolvable TODAY.

Headlines:
${headlines}

Respond with ONLY valid JSON in this structure:
{
  "marketTitle": "Short punchy title",
  "eventA": { "description": "Short trigger", "dataSource": "URL", "aiCondition": "1-sentence condition" },
  "eventB": { "description": "Short outcome", "dataSource": "URL", "aiCondition": "1-sentence condition" }
}`;

  const response = sendRequester
    .sendRequest({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${config.geminiApiKey}`,
      method: "POST",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })
    .result();

  if (!ok(response)) {
    throw new Error(`Gemini API failed: ${response.statusCode}`);
  }

  const data = json(response) as any;
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Gemini response");
  return JSON.parse(match[0]);
};

const uploadToPinata = (
  sendRequester: HTTPSendRequester,
  config: Config,
  marketData: any
): string => {
  marketData.generation_salt = Date.now();

  const response = sendRequester
    .sendRequest({
      url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      method: "POST",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "pinata_api_key", value: config.pinataApiKey },
        { key: "pinata_secret_api_key", value: config.pinataApiSecret },
      ],
      body: JSON.stringify({
        pinataContent: marketData,
        pinataMetadata: { name: marketData.marketTitle },
      }),
    })
    .result();

  if (!ok(response)) {
    throw new Error(`Pinata upload failed: ${response.statusCode}`);
  }

  const data = json(response) as any;
  return data.IpfsHash as string;
};

const onCronTrigger = (runtime: Runtime<Config>) => {
  runtime.log("🤖 [CRE] Domino Market Generation cycle starting...");

  const { evm } = runtime.config;
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evm.chainSelectorName,
    isTestnet: true,
  });

  if (!network) {
    throw new Error(`Network not found: ${evm.chainSelectorName}`);
  }

  const httpCapability = new cre.capabilities.HTTPClient();
  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Step 1: Fetch news
  const headlines = runtime.runInNodeMode(
    (nodeRuntime) => fetchNewsHeadlines(nodeRuntime.sendRequester),
    (results: string[]) => results[0] ?? ""
  )().result();

  runtime.log(`📰 [CRE] News fetched. ${headlines.split("\n").length} headlines.`);

  // Step 2: Generate market via Gemini
  const marketConfig = runtime.runInNodeMode(
    (nodeRuntime) =>
      generateMarketWithGemini(nodeRuntime.sendRequester, runtime.config, headlines),
    (results: any[]) => results[0]
  )().result();

  runtime.log(`✅ [CRE] Market generated: ${marketConfig.marketTitle}`);

  // Step 3: Upload to Pinata IPFS
  const ipfsHash = runtime.runInNodeMode(
    (nodeRuntime) =>
      uploadToPinata(nodeRuntime.sendRequester, runtime.config, marketConfig),
    (results: string[]) => results[0] ?? ""
  )().result();

  runtime.log(`📌 [CRE] IPFS CID: ${ipfsHash}`);

  // Step 4: Write market to blockchain via EVMClient
  const callData = encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: "createMarket",
    args: [ipfsHash, BigInt(86400), BigInt("10000000000000000")], // 24h, 0.01 ETH
  });

  const report = runtime.report(prepareReportRequest(callData)).result();

  runtime.log(`🚀 [CRE] Market deployed to ${evm.chainSelectorName}!`);
  return report;
};

export async function main() {
  const { Runner } = await import("@chainlink/cre-sdk");
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

function initWorkflow() {
  const cron = new cre.capabilities.CronCapability();
  const trigger = cron.trigger({ schedule: "0 */30 * * * *" }); // Every 30 minutes
  return [cre.handler(trigger, onCronTrigger)];
}
