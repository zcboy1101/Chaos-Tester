import type { ChaosRunReport } from "@/lib/chaos/types";

export type UiLanguage = "zh" | "en";

export const DEMO_REPORT_ZH: ChaosRunReport = {
  target_url: "https://api.example.com/v1/users",
  total: 10,
  passed: 7,
  failed: 3,
  results: [
    {
      test_name: "查询参数 SQL 注入",
      category: "sql_injection",
      expected_behavior: "拒绝恶意参数，且不能泄露数据库细节。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 400 安全拒绝了恶意输入。",
      request: {
        method: "GET",
        url: "https://api.example.com/v1/users?id=1%27%20OR%20%271%27%3D%271",
      },
      response: {
        status: 400,
        duration_ms: 42,
        body_preview: "{\"error\":\"invalid input\"}",
      },
    },
    {
      test_name: "NoSQL 操作符注入",
      category: "nosql_injection",
      expected_behavior: "将操作符当作普通数据处理，并拒绝畸形过滤条件。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 422 安全拒绝了恶意输入。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 422,
        duration_ms: 57,
        body_preview: "{\"error\":\"schema validation failed\"}",
      },
    },
    {
      test_name: "超大 metadata 载荷",
      category: "oversized_payload",
      expected_behavior: "拒绝超大载荷，且不能耗尽内存。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 413 安全拒绝了超大载荷。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 413,
        duration_ms: 64,
        body_preview: "{\"error\":\"payload too large\"}",
      },
    },
    {
      test_name: "零宽字符用户名",
      category: "unicode_edge_case",
      expected_behavior: "安全地归一化或拒绝混淆性 Unicode 字符。",
      verdict: "FAIL",
      reason: "目标 API 用成功响应接受了高风险边界载荷。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 201,
        duration_ms: 88,
        body_preview: "{\"id\":\"usr_491\",\"name\":\"admin\\u200b\\u200b\"}",
      },
    },
    {
      test_name: "负数年龄边界",
      category: "numeric_boundary",
      expected_behavior: "用明确的 4xx 响应拒绝负数值。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 400 安全拒绝了恶意输入。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 400,
        duration_ms: 33,
        body_preview: "{\"error\":\"age must be greater than zero\"}",
      },
    },
    {
      test_name: "数组冒充对象",
      category: "type_confusion",
      expected_behavior: "当接口预期对象结构时，应拒绝数组请求体。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 415 安全拒绝了类型错误的请求体。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 415,
        duration_ms: 51,
        body_preview: "{\"error\":\"unsupported body shape\"}",
      },
    },
    {
      test_name: "畸形 Bearer Token",
      category: "malformed_auth",
      expected_behavior: "拒绝畸形令牌，且不能暴露鉴权内部实现。",
      verdict: "FAIL",
      reason: "响应疑似暴露了错误堆栈或敏感实现细节。",
      request: { method: "GET", url: "https://api.example.com/v1/users" },
      response: {
        status: 401,
        duration_ms: 39,
        body_preview:
          "JsonWebTokenError: malformed jwt at verifyToken (/srv/auth/token.ts:42)",
      },
    },
    {
      test_name: "异常 DELETE 方法",
      category: "unexpected_method",
      expected_behavior: "返回 405，且不能修改任何状态。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 405 安全拒绝了异常方法。",
      request: { method: "DELETE", url: "https://api.example.com/v1/users" },
      response: {
        status: 405,
        duration_ms: 28,
        body_preview: "{\"error\":\"method not allowed\"}",
      },
    },
    {
      test_name: "重复 role 参数",
      category: "schema_violation",
      expected_behavior: "稳定拒绝重复的敏感字段。",
      verdict: "FAIL",
      reason: "目标 API 用成功响应接受了高风险边界载荷。",
      request: {
        method: "POST",
        url: "https://api.example.com/v1/users?role=user&role=admin",
      },
      response: {
        status: 200,
        duration_ms: 76,
        body_preview: "{\"role\":\"admin\",\"created\":true}",
      },
    },
    {
      test_name: "限流重放突刺",
      category: "rate_limit_or_replay",
      expected_behavior: "对重复载荷限流，且不能崩溃。",
      verdict: "PASS",
      reason: "目标 API 以 HTTP 429 安全拒绝了高频请求。",
      request: { method: "POST", url: "https://api.example.com/v1/users" },
      response: {
        status: 429,
        duration_ms: 24,
        body_preview: "{\"error\":\"too many requests\"}",
      },
    },
  ],
};

export const DEMO_REPORT_EN: ChaosRunReport = {
  ...DEMO_REPORT_ZH,
  results: [
    {
      ...DEMO_REPORT_ZH.results[0],
      test_name: "SQL Injection in Query Parameter",
      expected_behavior: "Reject the payload without leaking database details.",
      reason: "Target API rejected the malicious input safely with HTTP 400.",
    },
    {
      ...DEMO_REPORT_ZH.results[1],
      test_name: "NoSQL Operator Injection",
      expected_behavior: "Treat operators as plain data and reject malformed filters.",
      reason: "Target API rejected the malicious input safely with HTTP 422.",
    },
    {
      ...DEMO_REPORT_ZH.results[2],
      test_name: "Oversized Metadata Payload",
      expected_behavior: "Reject oversized payloads without exhausting memory.",
      reason: "Target API rejected the malicious input safely with HTTP 413.",
    },
    {
      ...DEMO_REPORT_ZH.results[3],
      test_name: "Unicode Zero Width Name",
      expected_behavior: "Normalize or reject confusing Unicode safely.",
      reason:
        "Target API accepted the malicious boundary payload with a successful response.",
    },
    {
      ...DEMO_REPORT_ZH.results[4],
      test_name: "Negative Age Boundary",
      expected_behavior: "Reject negative numeric values with a clear 4xx response.",
      reason: "Target API rejected the malicious input safely with HTTP 400.",
    },
    {
      ...DEMO_REPORT_ZH.results[5],
      test_name: "Array Instead of Object",
      expected_behavior: "Reject an array body when an object schema is expected.",
      reason: "Target API rejected the malicious input safely with HTTP 415.",
    },
    {
      ...DEMO_REPORT_ZH.results[6],
      test_name: "Malformed Bearer Token",
      expected_behavior: "Reject malformed tokens without revealing auth internals.",
      reason:
        "Response appears to expose an error trace or sensitive implementation detail.",
    },
    {
      ...DEMO_REPORT_ZH.results[7],
      test_name: "Unexpected DELETE Method",
      expected_behavior: "Return 405 without mutating state.",
      reason: "Target API rejected the malicious input safely with HTTP 405.",
    },
    {
      ...DEMO_REPORT_ZH.results[8],
      test_name: "Duplicate Role Parameters",
      expected_behavior: "Reject duplicate sensitive fields deterministically.",
      reason:
        "Target API accepted the malicious boundary payload with a successful response.",
    },
    {
      ...DEMO_REPORT_ZH.results[9],
      test_name: "Rate Limit Replay Burst",
      expected_behavior: "Throttle repeated payloads without crashing.",
      reason: "Target API rejected the malicious input safely with HTTP 429.",
    },
  ],
};

export function getDemoReport(language: UiLanguage) {
  return language === "zh" ? DEMO_REPORT_ZH : DEMO_REPORT_EN;
}
