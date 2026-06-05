import { describe, expect, it } from "vitest";
import { resolveLlmConfig } from "@/lib/llm/config";

describe("resolveLlmConfig", () => {
  it("uses safe OpenAI defaults when no override is provided", () => {
    const config = resolveLlmConfig(undefined, {
      OPENAI_MODEL: "gpt-4o-mini",
    });

    expect(config).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
      baseUrl: undefined,
    });
  });

  it("supports OpenAI-compatible custom endpoints", () => {
    const config = resolveLlmConfig(
      {
        provider: "openai-compatible",
        model: "deepseek-chat",
        base_url: "https://api.deepseek.com/v1",
      },
      {},
    );

    expect(config).toEqual({
      provider: "openai-compatible",
      model: "deepseek-chat",
      baseUrl: "https://api.deepseek.com/v1",
    });
  });

  it("supports Gemini official provider defaults", () => {
    const config = resolveLlmConfig(
      {
        provider: "gemini",
      },
      {
        GEMINI_MODEL: "gemini-2.5-flash",
      },
    );

    expect(config).toEqual({
      provider: "gemini",
      model: "gemini-2.5-flash",
      baseUrl: undefined,
    });
  });

  it("maps DeepSeek to an OpenAI-compatible preset", () => {
    const config = resolveLlmConfig(
      {
        provider: "deepseek",
      },
      {},
    );

    expect(config).toEqual({
      provider: "deepseek",
      model: "deepseek-chat",
      baseUrl: "https://api.deepseek.com/v1",
    });
  });

  it("maps Qwen to DashScope OpenAI-compatible mode", () => {
    const config = resolveLlmConfig(
      {
        provider: "qwen",
      },
      {},
    );

    expect(config).toEqual({
      provider: "qwen",
      model: "qwen-plus",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  });

  it("accepts gml as a GLM alias", () => {
    const config = resolveLlmConfig(
      {
        provider: "gml",
      },
      {},
    );

    expect(config.provider).toBe("glm");
    expect(config.baseUrl).toBe("https://open.bigmodel.cn/api/paas/v4");
  });

  it("requires a base URL for MiMo unless configured", () => {
    expect(() =>
      resolveLlmConfig(
        {
          provider: "mimo",
        },
        {},
      ),
    ).toThrow("MIMO_BASE_URL");
  });

  it("rejects unsupported providers", () => {
    expect(() =>
      resolveLlmConfig(
        {
          provider: "unknown",
          model: "some-model",
        },
        {},
      ),
    ).toThrow("Unsupported LLM provider");
  });
});
