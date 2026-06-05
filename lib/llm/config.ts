import type { LlmConfig, LlmProvider, LlmRequestOverride } from "@/lib/chaos/types";
import { PROVIDER_OPTIONS, PROVIDER_PRESETS } from "@/lib/llm/provider-registry";

const PROVIDERS = new Set<LlmProvider>(
  PROVIDER_OPTIONS.map((provider) => provider.value),
);

type Environment = Partial<Record<string, string>>;

function normalizeProvider(provider: string | undefined): LlmProvider {
  if (!provider) {
    return "openai";
  }

  const normalized = provider.toLowerCase() === "gml" ? "glm" : provider.toLowerCase();

  if (normalized === "claude") {
    return "anthropic";
  }

  if (normalized === "custom") {
    return "openai-compatible";
  }

  if (!PROVIDERS.has(normalized as LlmProvider)) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  return normalized as LlmProvider;
}

function defaultModelFor(provider: LlmProvider, env: Environment) {
  const preset = PROVIDER_PRESETS[provider];
  return env[preset.modelEnv] ?? preset.defaultModel;
}

function defaultBaseUrlFor(provider: LlmProvider, env: Environment) {
  const preset = PROVIDER_PRESETS[provider];

  if (preset.kind !== "openai-compatible") {
    return undefined;
  }

  return (
    (preset.baseUrlEnv ? env[preset.baseUrlEnv] : undefined) ??
    preset.defaultBaseUrl
  );
}

export function resolveLlmConfig(
  override: LlmRequestOverride | undefined,
  env: Environment = process.env,
): LlmConfig {
  const provider = normalizeProvider(override?.provider);
  const model = override?.model?.trim() || defaultModelFor(provider, env);
  const baseUrl = override?.base_url?.trim() || defaultBaseUrlFor(provider, env);
  const preset = PROVIDER_PRESETS[provider];

  if (preset.requiresBaseUrl && !baseUrl) {
    throw new Error(`${preset.baseUrlEnv ?? "base_url"} or llm.base_url is required.`);
  }

  return {
    provider,
    model,
    baseUrl,
  };
}
