import { describe, expect, it } from "vitest";
import { parseGeneratedTestCases } from "@/lib/chaos/validation";

describe("parseGeneratedTestCases", () => {
  it("extracts valid generated test cases", () => {
    const result = parseGeneratedTestCases({
      test_cases: [
        {
          test_name: "Oversized name field",
          category: "oversized_payload",
          expected_behavior: "Reject the request with a clear 4xx response.",
          payload: {
            method: "POST",
            url: "https://api.example.com/users",
            headers: [],
            query: [],
            body: "{\"name\":\"aaa\"}",
          },
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].payload.method).toBe("POST");
  });

  it("rejects missing test_cases", () => {
    expect(() => parseGeneratedTestCases({})).toThrow("test_cases");
  });

  it("rejects cases with unsafe body types", () => {
    expect(() =>
      parseGeneratedTestCases({
        test_cases: [
          {
            test_name: "Bad body",
            category: "type_confusion",
            expected_behavior: "Reject invalid body.",
            payload: {
              method: "POST",
              url: "https://api.example.com/users",
              headers: [],
              query: [],
              body: { nested: true },
            },
          },
        ],
      }),
    ).toThrow("payload.body");
  });
});
