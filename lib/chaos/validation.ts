import type { ChaosTestCase } from "@/lib/chaos/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, path: string) {
  if (path.endsWith(".payload.body")) {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "string") {
      return value;
    }
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid generated test case: ${path} must be a string.`);
  }

  return value;
}

function readStringArrayRecords(
  value: unknown,
  path: string,
): Array<{ name: string; value: string }> {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid generated test case: ${path} must be an array.`);
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid generated test case: ${path}[${index}] must be an object.`);
    }

    return {
      name: readString(item.name, `${path}[${index}].name`),
      value: readString(item.value, `${path}[${index}].value`),
    };
  });
}

function parseOneTestCase(value: unknown, index: number): ChaosTestCase {
  if (!isRecord(value)) {
    throw new Error(`Invalid generated test case: test_cases[${index}] must be an object.`);
  }

  if (!isRecord(value.payload)) {
    throw new Error(
      `Invalid generated test case: test_cases[${index}].payload must be an object.`,
    );
  }

  return {
    test_name: readString(value.test_name, `test_cases[${index}].test_name`),
    category: readString(value.category, `test_cases[${index}].category`),
    expected_behavior: readString(
      value.expected_behavior,
      `test_cases[${index}].expected_behavior`,
    ),
    payload: {
      method: readString(value.payload.method, `test_cases[${index}].payload.method`),
      url: readString(value.payload.url, `test_cases[${index}].payload.url`),
      headers: readStringArrayRecords(
        value.payload.headers,
        `test_cases[${index}].payload.headers`,
      ),
      query: readStringArrayRecords(
        value.payload.query,
        `test_cases[${index}].payload.query`,
      ),
      body: readString(value.payload.body, `test_cases[${index}].payload.body`),
    },
  };
}

export function parseGeneratedTestCases(value: unknown): ChaosTestCase[] {
  if (!isRecord(value) || !Array.isArray(value.test_cases)) {
    throw new Error("Invalid generated output: test_cases must be an array.");
  }

  return value.test_cases.map((item, index) => parseOneTestCase(item, index));
}

export function parseGeneratedTestCaseJson(json: string): ChaosTestCase[] {
  try {
    return parseGeneratedTestCases(JSON.parse(json));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("The model returned invalid JSON.");
    }

    throw error;
  }
}
