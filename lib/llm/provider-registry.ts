import type { LlmProvider } from "@/lib/chaos/types";

export type ProviderKind = "openai" | "anthropic" | "gemini" | "openai-compatible";

export type ProviderPreset = {
  value: LlmProvider;
  label: string;
  kind: ProviderKind;
  defaultModel: string;
  modelEnv: string;
  apiKeyEnv: string[];
  defaultBaseUrl?: string;
  baseUrlEnv?: string;
  requiresBaseUrl?: boolean;
};

export const PROVIDER_PRESETS: Record<LlmProvider, ProviderPreset> = {
  openai: {
    value: "openai",
    label: "OpenAI",
    kind: "openai",
    defaultModel: "gpt-4o",
    modelEnv: "OPENAI_MODEL",
    apiKeyEnv: ["OPENAI_API_KEY"],
  },
  anthropic: {
    value: "anthropic",
    label: "Claude",
    kind: "anthropic",
    defaultModel: "claude-3-5-sonnet-latest",
    modelEnv: "ANTHROPIC_MODEL",
    apiKeyEnv: ["ANTHROPIC_API_KEY"],
  },
  gemini: {
    value: "gemini",
    label: "Gemini",
    kind: "gemini",
    defaultModel: "gemini-2.5-flash",
    modelEnv: "GEMINI_MODEL",
    apiKeyEnv: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  },
  deepseek: {
    value: "deepseek",
    label: "DeepSeek",
    kind: "openai-compatible",
    defaultModel: "deepseek-chat",
    modelEnv: "DEEPSEEK_MODEL",
    apiKeyEnv: ["DEEPSEEK_API_KEY"],
    defaultBaseUrl: "https://api.deepseek.com/v1",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
  },
  qwen: {
    value: "qwen",
    label: "Qwen",
    kind: "openai-compatible",
    defaultModel: "qwen-plus",
    modelEnv: "QWEN_MODEL",
    apiKeyEnv: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"],
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    baseUrlEnv: "QWEN_BASE_URL",
  },
  minimax: {
    value: "minimax",
    label: "MiniMax",
    kind: "openai-compatible",
    defaultModel: "MiniMax-M1",
    modelEnv: "MINIMAX_MODEL",
    apiKeyEnv: ["MINIMAX_API_KEY"],
    defaultBaseUrl: "https://api.minimax.chat/v1",
    baseUrlEnv: "MINIMAX_BASE_URL",
  },
  glm: {
    value: "glm",
    label: "GLM",
    kind: "openai-compatible",
    defaultModel: "glm-4-plus",
    modelEnv: "GLM_MODEL",
    apiKeyEnv: ["GLM_API_KEY", "ZHIPU_API_KEY"],
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    baseUrlEnv: "GLM_BASE_URL",
  },
  mimo: {
    value: "mimo",
    label: "MiMo",
    kind: "openai-compatible",
    defaultModel: "mimo",
    modelEnv: "MIMO_MODEL",
    apiKeyEnv: ["MIMO_API_KEY"],
    baseUrlEnv: "MIMO_BASE_URL",
    requiresBaseUrl: true,
  },
  "openai-compatible": {
    value: "openai-compatible",
    label: "Custom",
    kind: "openai-compatible",
    defaultModel: "gpt-4o",
    modelEnv: "CUSTOM_LLM_MODEL",
    apiKeyEnv: ["CUSTOM_LLM_API_KEY", "OPENAI_API_KEY"],
    baseUrlEnv: "CUSTOM_LLM_BASE_URL",
    requiresBaseUrl: true,
  },
};

export const PROVIDER_OPTIONS = Object.values(PROVIDER_PRESETS);

export function isOpenAiCompatibleProvider(provider: LlmProvider) {
  return PROVIDER_PRESETS[provider].kind === "openai-compatible";
}
