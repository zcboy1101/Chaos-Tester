import type { ChaosTestCase, ChaosTestResult, ChaosVerdict } from "@/lib/chaos/types";

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BODY_CHARS = 12_000;
const MAX_CONCURRENT_REQUESTS = 3;

const SENSITIVE_RESPONSE_PATTERNS = [
  /stack trace/i,
  /traceback/i,
  /sql syntax/i,
  /mysql/i,
  /postgres/i,
  /mongodb/i,
  /prisma/i,
  /sequelize/i,
  /exception/i,
  /internal server error/i,
  /jwt_secret/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /secret[_-]?key/i,
  /password/i,
  /private key/i,
];

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type Evaluation = {
  verdict: ChaosVerdict;
  reason: string;
};

function shouldSendBody(method: string) {
  return !["GET", "HEAD"].includes(method.toUpperCase());
}

function buildTestUrl(targetUrl: string, testCase: ChaosTestCase) {
  const baseTarget = new URL(targetUrl);
  const rawPayloadUrl = testCase.payload.url || targetUrl;
  const requestUrl = new URL(rawPayloadUrl, targetUrl);

  if (requestUrl.origin !== baseTarget.origin) {
    throw new Error("Generated test case tried to change target origin.");
  }

  for (const item of testCase.payload.query ?? []) {
    requestUrl.searchParams.set(item.name, item.value);
  }

  return requestUrl;
}

function buildHeaders(testCase: ChaosTestCase) {
  const headers = new Headers();

  headers.set("content-type", "application/json");
  headers.set("user-agent", "Chaos-Tester/0.1 defensive-boundary-test");

  for (const header of testCase.payload.headers ?? []) {
    const name = header.name.trim().toLowerCase();

    if (!name || ["host", "content-length", "connection"].includes(name)) {
      continue;
    }

    headers.set(header.name, header.value);
  }

  return headers;
}

export function evaluateResult(params: {
  status: number | null;
  body: string;
  error?: string;
}): Evaluation {
  const { status, body, error } = params;

  if (error) {
    return {
      verdict: "FAIL",
      reason: `Request failed before a safe API response was returned: ${error}`,
    };
  }

  if (status === null) {
    return {
      verdict: "FAIL",
      reason: "No HTTP status was returned.",
    };
  }

  const leakedSensitiveInfo = SENSITIVE_RESPONSE_PATTERNS.some((pattern) =>
    pattern.test(body),
  );

  if (leakedSensitiveInfo) {
    return {
      verdict: "FAIL",
      reason:
        "Response appears to expose an error trace or sensitive implementation detail.",
    };
  }

  if (status >= 500) {
    return {
      verdict: "FAIL",
      reason: `Target API returned ${status}, which suggests the payload may have crashed server-side handling.`,
    };
  }

  if (status >= 400 && status < 500) {
    return {
      verdict: "PASS",
      reason: `Target API rejected the malicious input safely with HTTP ${status}.`,
    };
  }

  if (status >= 200 && status < 300) {
    return {
      verdict: "FAIL",
      reason:
        "Target API accepted the malicious boundary payload with a successful response.",
    };
  }

  return {
    verdict: "PASS",
    reason: `Target API returned HTTP ${status} without obvious leakage or crash behavior.`,
  };
}

export async function executeChaosTestCase(params: {
  targetUrl: string;
  testCase: ChaosTestCase;
  fetchImpl?: FetchLike;
}): Promise<ChaosTestResult> {
  const { targetUrl, testCase, fetchImpl = fetch } = params;
  const method = testCase.payload.method.toUpperCase();
  const startedAt = performance.now();
  let requestUrl = targetUrl;

  try {
    const builtUrl = buildTestUrl(targetUrl, testCase);
    requestUrl = builtUrl.toString();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetchImpl(builtUrl, {
        method,
        headers: buildHeaders(testCase),
        body: shouldSendBody(method) ? testCase.payload.body ?? "" : undefined,
        signal: controller.signal,
        redirect: "manual",
      });

      const rawBody = await response.text();
      const bodyPreview = rawBody.slice(0, MAX_RESPONSE_BODY_CHARS);
      const durationMs = Math.round(performance.now() - startedAt);
      const evaluation = evaluateResult({
        status: response.status,
        body: bodyPreview,
      });

      return {
        test_name: testCase.test_name,
        category: testCase.category,
        expected_behavior: testCase.expected_behavior,
        verdict: evaluation.verdict,
        reason: evaluation.reason,
        request: {
          method,
          url: requestUrl,
        },
        response: {
          status: response.status,
          duration_ms: durationMs,
          body_preview: bodyPreview,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    const message =
      error instanceof Error && error.name === "AbortError"
        ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms.`
        : error instanceof Error
          ? error.message
          : "Unknown request error.";
    const evaluation = evaluateResult({
      status: null,
      body: "",
      error: message,
    });

    return {
      test_name: testCase.test_name,
      category: testCase.category,
      expected_behavior: testCase.expected_behavior,
      verdict: evaluation.verdict,
      reason: evaluation.reason,
      request: {
        method,
        url: requestUrl,
      },
      response: {
        status: null,
        duration_ms: durationMs,
        body_preview: "",
        error: message,
      },
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => runWorker()),
  );

  return results;
}

export async function executeChaosTestCases(params: {
  targetUrl: string;
  testCases: ChaosTestCase[];
  fetchImpl?: FetchLike;
}) {
  const { targetUrl, testCases, fetchImpl } = params;

  return runWithConcurrency(
    testCases,
    MAX_CONCURRENT_REQUESTS,
    async (testCase) =>
      executeChaosTestCase({
        targetUrl,
        testCase,
        fetchImpl,
      }),
  );
}
