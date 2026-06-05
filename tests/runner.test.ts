import { describe, expect, it, vi } from "vitest";
import { evaluateResult, executeChaosTestCase } from "@/lib/chaos/runner";
import type { ChaosTestCase } from "@/lib/chaos/types";

const baseCase: ChaosTestCase = {
  test_name: "SQL injection in user id",
  category: "sql_injection",
  expected_behavior: "Reject the payload without leaking database details.",
  payload: {
    method: "POST",
    url: "https://api.example.com/users",
    headers: [{ name: "x-test", value: "chaos" }],
    query: [{ name: "id", value: "1' OR '1'='1" }],
    body: "{\"id\":\"1' OR '1'='1\"}",
  },
};

describe("evaluateResult", () => {
  it("marks defensive 4xx responses as PASS", () => {
    expect(
      evaluateResult({
        status: 400,
        body: "{\"error\":\"invalid input\"}",
      }),
    ).toEqual({
      verdict: "PASS",
      reason: "Target API rejected the malicious input safely with HTTP 400.",
    });
  });

  it("marks server crashes as FAIL", () => {
    expect(
      evaluateResult({
        status: 500,
        body: "{\"error\":\"internal server error\"}",
      }).verdict,
    ).toBe("FAIL");
  });

  it("marks leaked implementation details as FAIL", () => {
    expect(
      evaluateResult({
        status: 400,
        body: "PrismaClientKnownRequestError stack trace",
      }).verdict,
    ).toBe("FAIL");
  });
});

describe("executeChaosTestCase", () => {
  it("adds generated query params and records timing", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response("{\"error\":\"invalid input\"}", { status: 400 });
    });

    const result = await executeChaosTestCase({
      targetUrl: "https://api.example.com/users",
      testCase: baseCase,
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "https://api.example.com/users?id=1%27+OR+%271%27%3D%271",
    );
    expect(result.verdict).toBe("PASS");
    expect(result.response.status).toBe(400);
    expect(result.response.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("blocks generated test cases that try to change origin", async () => {
    const result = await executeChaosTestCase({
      targetUrl: "https://api.example.com/users",
      testCase: {
        ...baseCase,
        payload: {
          ...baseCase.payload,
          url: "https://evil.example.net/steal",
        },
      },
      fetchImpl: vi.fn(),
    });

    expect(result.verdict).toBe("FAIL");
    expect(result.response.error).toContain("change target origin");
  });
});
