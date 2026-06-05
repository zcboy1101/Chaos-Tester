export type LlmProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "qwen"
  | "minimax"
  | "glm"
  | "mimo"
  | "openai-compatible";

export type LlmConfig = {
  provider: LlmProvider;
  model: string;
  baseUrl?: string;
};

export type LlmRequestOverride = {
  provider?: string;
  model?: string;
  base_url?: string;
};

export type ChaosTestCategory =
  | "sql_injection"
  | "nosql_injection"
  | "oversized_payload"
  | "unicode_edge_case"
  | "numeric_boundary"
  | "type_confusion"
  | "missing_required_field"
  | "malformed_auth"
  | "unexpected_method"
  | "rate_limit_or_replay"
  | "schema_violation"
  | "other";

export type ChaosTestCase = {
  test_name: string;
  category: ChaosTestCategory | string;
  expected_behavior: string;
  payload: {
    method: string;
    url?: string;
    headers?: Array<{
      name: string;
      value: string;
    }>;
    query?: Array<{
      name: string;
      value: string;
    }>;
    body?: string;
  };
};

export type ChaosVerdict = "PASS" | "FAIL";

export type ChaosTestResult = {
  test_name: string;
  category: string;
  expected_behavior: string;
  verdict: ChaosVerdict;
  reason: string;
  request: {
    method: string;
    url: string;
  };
  response: {
    status: number | null;
    duration_ms: number;
    body_preview: string;
    error?: string;
  };
};

export type ChaosRunReport = {
  target_url: string;
  total: number;
  passed: number;
  failed: number;
  results: ChaosTestResult[];
};
