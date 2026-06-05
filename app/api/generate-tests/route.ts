import { NextResponse } from "next/server";
import { executeChaosTestCases } from "@/lib/chaos/runner";
import type { ChaosRunReport, LlmRequestOverride } from "@/lib/chaos/types";
import { generateChaosTestCases } from "@/lib/llm/generate-test-cases";
import { resolveLlmConfig } from "@/lib/llm/config";

export const runtime = "nodejs";

const GENERATION_TIMEOUT_MS = 75_000;
const EXECUTION_TIMEOUT_MS = 45_000;

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type GenerateTestsRequest = {
  target_url?: unknown;
  api_description?: unknown;
  llm?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseLlmOverride(value: unknown): LlmRequestOverride | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new HttpError(400, "invalid_llm_config", "llm must be an object.");
  }

  return {
    provider: typeof value.provider === "string" ? value.provider : undefined,
    model: typeof value.model === "string" ? value.model : undefined,
    base_url: typeof value.base_url === "string" ? value.base_url : undefined,
  };
}

function validateInput(body: GenerateTestsRequest) {
  const targetUrl = typeof body.target_url === "string" ? body.target_url.trim() : "";
  const apiDescription =
    typeof body.api_description === "string" ? body.api_description.trim() : "";

  if (!targetUrl) {
    throw new HttpError(400, "missing_target_url", "target_url is required.");
  }

  if (!apiDescription) {
    throw new HttpError(
      400,
      "missing_api_description",
      "api_description is required.",
    );
  }

  if (targetUrl.length > 2048) {
    throw new HttpError(400, "target_url_too_long", "target_url is too long.");
  }

  if (apiDescription.length > 8000) {
    throw new HttpError(
      400,
      "api_description_too_long",
      "api_description is too long.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new HttpError(400, "invalid_target_url", "target_url must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new HttpError(
      400,
      "unsupported_target_url_protocol",
      "target_url must use http or https.",
    );
  }

  return {
    targetUrl,
    apiDescription,
    llmOverride: parseLlmOverride(body.llm),
  };
}

function getProviderStatus(error: unknown) {
  if (isRecord(error) && typeof error.status === "number") {
    return error.status;
  }

  return undefined;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  code: string,
  message: string,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new HttpError(504, code, message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function POST(request: Request) {
  try {
    let body: GenerateTestsRequest;

    try {
      const json = await request.json();
      body = isRecord(json) ? json : {};
    } catch {
      throw new HttpError(400, "invalid_json", "Request body must be valid JSON.");
    }

    const { targetUrl, apiDescription, llmOverride } = validateInput(body);
    const llm = resolveLlmConfig(llmOverride);
    const testCases = await withTimeout(
      generateChaosTestCases({
        targetUrl,
        apiDescription,
        llm,
      }),
      GENERATION_TIMEOUT_MS,
      "llm_generation_timeout",
      "The model did not return test cases before the generation timeout.",
    );

    const results = await withTimeout(
      executeChaosTestCases({
        targetUrl,
        testCases,
      }),
      EXECUTION_TIMEOUT_MS,
      "chaos_execution_timeout",
      "The test execution engine did not finish before the execution timeout.",
    );

    const report: ChaosRunReport = {
      target_url: targetUrl,
      total: results.length,
      passed: results.filter((item) => item.verdict === "PASS").length,
      failed: results.filter((item) => item.verdict === "FAIL").length,
      results,
    };

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error("[chaos-tester] generate-tests failed", error);

    if (error instanceof HttpError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.status },
      );
    }

    const providerStatus = getProviderStatus(error);
    const message =
      error instanceof Error ? error.message : "Failed to generate chaos test report.";

    return NextResponse.json(
      {
        error: {
          code: "chaos_generation_failed",
          message,
        },
      },
      { status: providerStatus === 429 ? 429 : 502 },
    );
  }
}
