import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { CHAOS_SYSTEM_PROMPT } from "@/lib/chaos/prompt";
import { CHAOS_TEST_CASES_SCHEMA } from "@/lib/chaos/schema";
import type { ChaosTestCase, LlmConfig } from "@/lib/chaos/types";
import { parseGeneratedTestCaseJson, parseGeneratedTestCases } from "@/lib/chaos/validation";
import { PROVIDER_PRESETS } from "@/lib/llm/provider-registry";

const TOOL_NAME = "return_chaos_test_cases";

type GenerateTestCasesParams = {
  targetUrl: string;
  apiDescription: string;
  llm: LlmConfig;
};

type MutableInputSchema = {
  type: "object";
  properties?: unknown;
  required?: string[] | null;
  [key: string]: unknown;
};

function getApiKey(llm: LlmConfig) {
  const preset = PROVIDER_PRESETS[llm.provider];
  const apiKey = preset.apiKeyEnv
    .map((envName) => process.env[envName])
    .find((value): value is string => Boolean(value));

  if (!apiKey) {
    throw new Error(`${preset.apiKeyEnv.join(" or ")} is not configured.`);
  }

  return apiKey;
}

function buildUserPayload(params: GenerateTestCasesParams) {
  return JSON.stringify({
    target_url: params.targetUrl,
    api_description: params.apiDescription,
  });
}

function buildJsonModePrompt(params: GenerateTestCasesParams) {
  return [
    "Generate the chaos API boundary test cases for this target.",
    "Return exactly one JSON object matching this JSON Schema.",
    "Do not include markdown or commentary.",
    "Every JSON field must be a concrete JSON literal.",
    "Do not use JavaScript expressions, string concatenation, .repeat(), ellipses, comments, or placeholders.",
    "For oversized payload ideas, use a bounded representative literal string under 2000 characters.",
    "",
    "JSON Schema:",
    JSON.stringify(CHAOS_TEST_CASES_SCHEMA),
    "",
    "Target input:",
    buildUserPayload(params),
  ].join("\n");
}

function getMutableInputSchema(): MutableInputSchema {
  return JSON.parse(JSON.stringify(CHAOS_TEST_CASES_SCHEMA)) as MutableInputSchema;
}

async function generateWithOpenAi(params: GenerateTestCasesParams) {
  const apiKey = getApiKey(params.llm);
  const preset = PROVIDER_PRESETS[params.llm.provider];

  const client = new OpenAI({
    apiKey,
    baseURL: preset.kind === "openai-compatible" ? params.llm.baseUrl : undefined,
    timeout: 30_000,
  });

  const completion = await client.chat.completions.create({
    model: params.llm.model,
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: CHAOS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildUserPayload(params),
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: TOOL_NAME,
          description:
            "Return strictly structured API chaos test cases as a JSON array under test_cases.",
          strict: true,
          parameters: CHAOS_TEST_CASES_SCHEMA,
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: {
        name: TOOL_NAME,
      },
    },
  });

  const toolCall = completion.choices[0]?.message.tool_calls?.find(
    (call) =>
      call.type === "function" &&
      "function" in call &&
      call.function.name === TOOL_NAME,
  );

  if (!toolCall || !("function" in toolCall) || !toolCall.function.arguments) {
    throw new Error("The model did not return structured test cases.");
  }

  return parseGeneratedTestCaseJson(toolCall.function.arguments);
}

async function generateWithOpenAiJsonMode(params: GenerateTestCasesParams) {
  if (!params.llm.baseUrl) {
    throw new Error("OpenAI-compatible base URL is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let response: Response;

  try {
    response = await fetch(`${params.llm.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${getApiKey(params.llm)}`,
        "content-type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: params.llm.model,
        temperature: 0.25,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: CHAOS_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: buildJsonModePrompt(params),
          },
        ],
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `OpenAI-compatible provider returned HTTP ${response.status}.`,
    );
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("The model did not return structured test cases.");
  }

  return parseGeneratedTestCaseJson(content);
}

async function generateWithAnthropic(params: GenerateTestCasesParams) {
  const apiKey = getApiKey(params.llm);

  const client = new Anthropic({
    apiKey,
    timeout: 30_000,
  });

  const message = await client.messages.create({
    model: params.llm.model,
    max_tokens: 4096,
    temperature: 0.25,
    system: CHAOS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPayload(params),
      },
    ],
    tools: [
      {
        name: TOOL_NAME,
        description:
          "Return strictly structured API chaos test cases as a JSON array under test_cases.",
        input_schema: getMutableInputSchema(),
      },
    ],
    tool_choice: {
      type: "tool",
      name: TOOL_NAME,
    },
  });

  const toolUse = message.content.find(
    (item) => item.type === "tool_use" && item.name === TOOL_NAME,
  );

  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The model did not return structured test cases.");
  }

  return parseGeneratedTestCases(toolUse.input);
}

async function generateWithGemini(params: GenerateTestCasesParams) {
  const client = new GoogleGenAI({
    apiKey: getApiKey(params.llm),
  });

  const response = await client.models.generateContent({
    model: params.llm.model,
    contents: buildUserPayload(params),
    config: {
      systemInstruction: CHAOS_SYSTEM_PROMPT,
      temperature: 0.25,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseJsonSchema: getMutableInputSchema(),
    },
  });

  if (!response.text) {
    throw new Error("The model did not return structured test cases.");
  }

  return parseGeneratedTestCaseJson(response.text);
}

export async function generateChaosTestCases(
  params: GenerateTestCasesParams,
): Promise<ChaosTestCase[]> {
  if (PROVIDER_PRESETS[params.llm.provider].kind === "openai-compatible") {
    return generateWithOpenAiJsonMode(params);
  }

  if (params.llm.provider === "anthropic") {
    return generateWithAnthropic(params);
  }

  if (params.llm.provider === "gemini") {
    return generateWithGemini(params);
  }

  return generateWithOpenAi(params);
}
