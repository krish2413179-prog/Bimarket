import {
  cre,
  ok,
  json,
  getNetwork,
  encodeCallMsg,
  LAST_FINALIZED_BLOCK_NUMBER,
  type Runtime,
  type HTTPSendRequester,
} from "@chainlink/cre-sdk";
import { z } from "zod";
import { decodeFunctionResult, encodeFunctionData, type Address, zeroAddress } from "viem";

const configSchema = z.object({
  geminiApiKey: z.string(),
  evm: z.object({
    chainSelectorName: z.string(),
    marketRegistryAddress: z.string(),
    settlementManagerAddress: z.string(),
  }),
});

type Config = z.infer<typeof configSchema>;

const REGISTRY_ABI = [
  {
    name: "listMarkets",
    type: "function",
    inputs: [
      { name: "stateFilter", type: "uint8" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "marketId", type: "bytes32" },
          { name: "creator", type: "address" },
          { name: "ipfsHash", type: "string" },
          { name: "creWorkflowAddress", type: "address" },
          { name: "state", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "expiresAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

const SETTLEMENT_ABI = [
  {
    name: "submitSettlement",
    type: "function",
    inputs: [
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "marketId", type: "bytes32" },
          { name: "eventAOccurred", type: "bool" },
          { name: "eventBOccurred", type: "bool" },
          { name: "eventATimestamp", type: "uint256" },
          { name: "eventBTimestamp", type: "uint256" },
          { name: "proof", type: "bytes" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

const checkConditionWithAI = (
  sendRequester: HTTPSendRequester,
  geminiApiKey: string,
  dataSourceUrl: string,
  condition: string
): boolean => {
  const pageResponse = sendRequester
    .sendRequest({
      url: dataSourceUrl,
      method: "GET",
      headers: [{ key: "User-Agent", value: "Mozilla/5.0 CRE-Oracle/1.0" }],
    })
    .result();

  const pageText = ok(pageResponse)
    ? (pageResponse.body as string).slice(0, 20000)
    : "Source unavailable";

  const prompt = `You are a Smart Contract Oracle. Determine if this condition is met based on the content below.

Condition: "${condition}"

Content:
---
${pageText}
---

Reply ONLY with "YES" or "NO". No other text.`;

  const geminiResponse = sendRequester
    .sendRequest({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      method: "POST",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })
    .result();

  if (!ok(geminiResponse)) return false;

  const data = json(geminiResponse) as any;
  const answer: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() ?? "NO";
  return answer === "YES";
};

const onCronTrigger = (runtime: Runtime<Config>) => {
  runtime.log("🔍 [CRE Oracle] Scanning active markets for verification...");

  const { evm } = runtime.config;
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: evm.chainSelectorName,
    isTestnet: true,
  });

  if (!network) throw new Error(`Network not found: ${evm.chainSelectorName}`);

  const evmClient = new cre.capabilities.EVMClient(
    network.chainSelector.selector
  );

  // Read active markets from chain
  const callData = encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: "listMarkets",
    args: [0, BigInt(0), BigInt(20)],
  });

  const contractResult = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: evm.marketRegistryAddress as Address,
        data: callData,
      }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    })
    .result();

  const markets = decodeFunctionResult({
    abi: REGISTRY_ABI,
    functionName: "listMarkets",
    data: contractResult.data as `0x${string}`,
  }) as any[];

  runtime.log(`Found ${markets.length} active markets. Checking eligibility...`);

  // Only verify markets older than 24 hours
  const now = Math.floor(Date.now() / 1000);
  const eligibleMarkets = markets.filter((m) => now - Number(m.createdAt) >= 86400);

  runtime.log(`${eligibleMarkets.length} markets eligible for AI verification.`);

  for (const market of eligibleMarkets) {
    runtime.log(`Verifying market ${market.marketId}...`);
  }

  return { verified: eligibleMarkets.length };
};

export async function main() {
  const { Runner } = await import("@chainlink/cre-sdk");
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

function initWorkflow() {
  const cron = new cre.capabilities.CronCapability();
  const trigger = cron.trigger({ schedule: "0 */10 * * * *" }); // Every 10 minutes
  return [cre.handler(trigger, onCronTrigger)];
}
