export const CHAOS_TEST_CASES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["test_cases"],
  properties: {
    test_cases: {
      type: "array",
      minItems: 8,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["test_name", "category", "payload", "expected_behavior"],
        properties: {
          test_name: {
            type: "string",
            description: "A short, specific name for the test case.",
          },
          category: {
            type: "string",
            enum: [
              "sql_injection",
              "nosql_injection",
              "oversized_payload",
              "unicode_edge_case",
              "numeric_boundary",
              "type_confusion",
              "missing_required_field",
              "malformed_auth",
              "unexpected_method",
              "rate_limit_or_replay",
              "schema_violation",
              "other",
            ],
          },
          payload: {
            type: "object",
            additionalProperties: false,
            required: ["method", "url", "headers", "query", "body"],
            properties: {
              method: {
                type: "string",
                enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
              },
              url: {
                type: "string",
                description: "The target URL to test.",
              },
              headers: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "value"],
                  properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                  },
                },
              },
              query: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "value"],
                  properties: {
                    name: { type: "string" },
                    value: { type: "string" },
                  },
                },
              },
              body: {
                type: "string",
                description:
                  "Raw request body. JSON bodies must be serialized as strings.",
              },
            },
          },
          expected_behavior: {
            type: "string",
            description: "The safe behavior expected from a robust API.",
          },
        },
      },
    },
  },
} as const;
