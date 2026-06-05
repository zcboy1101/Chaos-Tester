"use client";

import { FormEvent, useMemo, useState } from "react";
import ChaosResultsDashboard from "@/components/ChaosResultsDashboard";
import type { ChaosRunReport, LlmProvider } from "@/lib/chaos/types";
import { getDemoReport, type UiLanguage } from "@/lib/chaos/demo-report";
import { PROVIDER_OPTIONS } from "@/lib/llm/provider-registry";

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

function readApiError(value: unknown) {
  const payload = value as ApiError;
  return payload.error?.message || "测试任务失败，请检查模型配置和目标 API。";
}

const copy = {
  zh: {
    apiDescription:
      "POST /v1/users 用于创建用户。接口接收包含 name、email、age、role 和可选 metadata 的 JSON。非法输入应返回 4xx，且不能泄露堆栈或内部实现细节。",
    eyebrow: "AI 边界测试引擎",
    adapter: "模型适配器",
    mission: "任务输入",
    title: "发起撞击",
    targetUrl: "目标 API 地址",
    behavior: "预期接口行为",
    behaviorPlaceholder: "描述参数、响应格式、鉴权、正常行为和边界约束...",
    provider: "模型服务",
    model: "模型名称",
    baseUrl: "接口地址",
    keyEnv: "密钥环境变量：",
    running: "撞击中...",
    start: "开始拆台",
    demo: "载入演示报告",
    waiting: "等待报告",
    standby: "结果面板待命",
    waitingCopy:
      "提交后，大模型会生成边界测试用例，执行器会逐个撞击目标 API，最后在这里输出防御率、崩溃数和终端日志。",
    drift: "结构漂移",
    driftValue: "null / 空串 / NaN / 0x7fffffff",
    radar: "崩溃雷达",
    radarValue: "5xx / 堆栈泄露 / 超时",
  },
  en: {
    apiDescription:
      "POST /v1/users creates a user. It expects JSON with name, email, age, role, and optional metadata. Invalid input should return 4xx without stack traces.",
    eyebrow: "AI Boundary Testing Engine",
    adapter: "Model adapter",
    mission: "Mission Input",
    title: "Launch Strike",
    targetUrl: "Target API URL",
    behavior: "Expected API behavior",
    behaviorPlaceholder:
      "Describe parameters, response shape, auth, normal behavior, and boundary constraints...",
    provider: "Provider",
    model: "Model",
    baseUrl: "Base URL",
    keyEnv: "Key env:",
    running: "Running...",
    start: "Start Chaos Test",
    demo: "Load Demo Report",
    waiting: "Awaiting Report",
    standby: "Vibe Panel Standby",
    waitingCopy:
      "After submission, the model generates boundary test cases, the runner strikes the target API, and the report appears here.",
    drift: "Schema drift",
    driftValue: "null / empty string / NaN / 0x7fffffff",
    radar: "Crash radar",
    radarValue: "5xx / trace leak / timeout",
  },
} satisfies Record<UiLanguage, Record<string, string>>;

export default function ChaosWorkbench() {
  const [language, setLanguage] = useState<UiLanguage>("zh");
  const [targetUrl, setTargetUrl] = useState("https://api.example.com/v1/users");
  const [apiDescription, setApiDescription] = useState(copy.zh.apiDescription);
  const [provider, setProvider] = useState<LlmProvider>("openai");
  const [model, setModel] = useState("gpt-4o");
  const [baseUrl, setBaseUrl] = useState("");
  const [report, setReport] = useState<ChaosRunReport | null>(getDemoReport("zh"));
  const [isDemoReport, setIsDemoReport] = useState(true);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const text = copy[language];

  const selectedProvider = useMemo(
    () => PROVIDER_OPTIONS.find((option) => option.value === provider),
    [provider],
  );
  const needsBaseUrl = selectedProvider?.kind === "openai-compatible";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsRunning(true);
    setReport(null);

    try {
      const response = await fetch("/api/generate-tests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          target_url: targetUrl,
          api_description: apiDescription,
          llm: {
            provider,
            model,
            base_url: baseUrl || undefined,
          },
        }),
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        throw new Error(readApiError(payload));
      }

      setReport(payload as ChaosRunReport);
      setIsDemoReport(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "测试任务失败，请稍后重试。",
      );
    } finally {
      setIsRunning(false);
    }
  }

  function changeLanguage(nextLanguage: UiLanguage) {
    setLanguage(nextLanguage);

    if (isDemoReport) {
      setReport(getDemoReport(nextLanguage));
    }

    if (apiDescription === copy.zh.apiDescription || apiDescription === copy.en.apiDescription) {
      setApiDescription(copy[nextLanguage].apiDescription);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070d] px-3 py-4 text-slate-100 sm:px-5 sm:py-6 lg:px-8 xl:px-10">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none fixed left-8 top-40 hidden w-56 rounded-lg border border-cyan-300/15 bg-white/[0.03] p-3 font-mono text-xs leading-6 text-cyan-100/45 lg:block">
        <p className="text-emerald-300/70">$ fuzz --target api</p>
        <p>{'{ "limit": -1 }'}</p>
        <p>{'{ "role": "admin" }'}</p>
        <p className="text-red-300/70">429 retry-after: 0</p>
      </div>
      <div className="pointer-events-none fixed bottom-12 right-12 hidden w-64 rounded-lg border border-cyan-300/15 bg-white/[0.03] p-4 font-mono text-xs text-slate-400 xl:block">
        <div className="flex justify-between">
          <span>POST /v1/users</span>
          <span className="text-emerald-300">200</span>
        </div>
        <div className="mt-3 flex justify-between">
          <span>GET /debug</span>
          <span className="text-yellow-300">403</span>
        </div>
        <div className="mt-3 flex justify-between">
          <span>PATCH /quota</span>
          <span className="text-red-300">500</span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <header className="flex flex-col gap-4 border-b border-cyan-300/20 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
              {text.eyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Chaos-Tester
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div className="max-w-full truncate rounded-full border border-cyan-300/25 bg-slate-950/80 px-4 py-2 font-mono text-xs text-cyan-100">
              {text.adapter}: {selectedProvider?.label ?? provider}
            </div>

            <div className="flex w-fit rounded-md border border-cyan-300/25 bg-slate-950/80 p-1 font-mono text-xs text-slate-400">
              {(["zh", "en"] as const).map((option) => (
                <button
                  className={`h-8 rounded px-3 transition ${
                    language === option
                      ? "bg-cyan-300 text-slate-950"
                      : "text-cyan-100 hover:bg-cyan-300/10"
                  }`}
                  key={option}
                  onClick={() => changeLanguage(option)}
                  type="button"
                >
                  {option === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>
          </div>
        </header>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-lg border border-cyan-300/20 bg-slate-950/90 p-4 shadow-[0_0_48px_rgba(34,211,238,0.12)] sm:p-5"
          >
            <div className="mb-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
                {text.mission}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">{text.title}</h2>
            </div>

            <label className="block text-sm font-bold text-slate-200" htmlFor="target-url">
              {text.targetUrl}
            </label>
            <input
              id="target-url"
              className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-black/30 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://api.example.com/v1/users"
              type="url"
              required
            />

            <label
              className="mt-5 block text-sm font-bold text-slate-200"
              htmlFor="api-description"
            >
              {text.behavior}
            </label>
            <textarea
              id="api-description"
              className="mt-2 min-h-40 w-full resize-y rounded-md border border-slate-700 bg-black/30 px-3 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
              value={apiDescription}
              onChange={(event) => setApiDescription(event.target.value)}
              placeholder={text.behaviorPlaceholder}
              required
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <div>
                <label className="block text-sm font-bold text-slate-200" htmlFor="provider">
                  {text.provider}
                </label>
                <select
                  id="provider"
                  className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-black/30 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300"
                  value={provider}
                  onChange={(event) => {
                    const nextProvider = event.target.value as LlmProvider;
                    setProvider(nextProvider);
                    const nextOption = PROVIDER_OPTIONS.find(
                      (option) => option.value === nextProvider,
                    );
                    setModel(nextOption?.defaultModel ?? "");
                    setBaseUrl(nextOption?.defaultBaseUrl ?? "");
                  }}
                >
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200" htmlFor="model">
                  {text.model}
                </label>
                <input
                  id="model"
                  className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-black/30 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={selectedProvider?.defaultModel}
                  required
                />
              </div>
            </div>

            {needsBaseUrl ? (
              <div className="mt-5">
                <label
                  className="block text-sm font-bold text-slate-200"
                  htmlFor="base-url"
                >
                  {text.baseUrl}
                </label>
                <input
                  id="base-url"
                  className="mt-2 h-11 w-full rounded-md border border-slate-700 bg-black/30 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder={
                    selectedProvider?.defaultBaseUrl ??
                    selectedProvider?.baseUrlEnv ??
                    "https://provider.example.com/v1"
                  }
                  required={Boolean(selectedProvider?.requiresBaseUrl)}
                  type="url"
                />
              </div>
            ) : null}

            <div className="mt-4 overflow-hidden rounded-md border border-slate-800 bg-black/20 p-3 font-mono text-xs text-slate-500">
              <span className="text-cyan-300">{text.keyEnv}</span>{" "}
              <span className="break-words">{selectedProvider?.apiKeyEnv.join(" / ")}</span>
            </div>

            {error ? (
              <div className="mt-5 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex justify-center">
              <button
                className="h-12 rounded-md border border-cyan-300/30 bg-cyan-300 px-8 font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.22)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRunning}
                type="submit"
              >
                {isRunning ? text.running : text.start}
              </button>
            </div>

            <button
              className="mt-3 min-h-10 w-full rounded-md border border-slate-700 bg-black/30 px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-cyan-200 transition hover:border-cyan-300 hover:text-white sm:tracking-[0.18em]"
              onClick={() => {
                setError("");
                setReport(getDemoReport(language));
                setIsDemoReport(true);
              }}
              type="button"
            >
              {text.demo}
            </button>
          </form>

          <div className="min-w-0 rounded-lg border border-cyan-300/20 bg-slate-950/55 p-4 sm:p-5 xl:min-h-[520px]">
            {report ? (
              <ChaosResultsDashboard data={report} language={language} />
            ) : (
              <div className="flex min-h-[420px] flex-col justify-between gap-8 xl:min-h-[480px]">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
                    {text.waiting}
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-white">
                    {text.standby}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                    {text.waitingCopy}
                  </p>
                </div>

                <div className="grid gap-3 font-mono text-xs text-slate-500 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <div className="rounded-md border border-slate-800 bg-black/30 p-4">
                    <p className="text-cyan-300">{text.drift}</p>
                    <p className="mt-2">{text.driftValue}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-black/30 p-4">
                    <p className="text-red-300">{text.radar}</p>
                    <p className="mt-2">{text.radarValue}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
