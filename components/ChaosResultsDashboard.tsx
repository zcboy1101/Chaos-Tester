"use client";

import type { ChaosRunReport, ChaosTestResult, ChaosVerdict } from "@/lib/chaos/types";
import type { UiLanguage } from "@/lib/chaos/demo-report";

type ChaosResultsDashboardProps = {
  data: ChaosRunReport;
  language: UiLanguage;
};

const copy = {
  zh: {
    pass: "已防住",
    fail: "已击穿",
    noResponse: "无响应",
    serverCrash: "服务崩溃",
    rejected: "安全拒绝",
    accepted: "已接受",
    unknown: "未知状态",
    fire: "发射载荷",
    httpStatus: "HTTP 状态",
    latency: "耗时",
    verdict: "判定",
    expected: "预期行为：",
    analysis: "分析：",
    responsePreview: "查看响应体预览",
    emptyResponse: "[空响应]",
    defenseScore: "防御评分",
    defenseIntegrity: "防御完整度",
    total: "总数",
    defended: "防住",
    breached: "击穿",
    crashRadar: "崩溃雷达",
    noBreach: "暂无击穿",
    risks: "个风险",
    crashCopy:
      "红色项代表目标 API 返回 5xx、泄露敏感错误信息、超时，或接受了高风险 payload。",
    logPath: "/日志/chaos-runner",
    categories: {
      sql_injection: "SQL 注入",
      nosql_injection: "NoSQL 注入",
      oversized_payload: "超大载荷",
      unicode_edge_case: "Unicode 边界",
      numeric_boundary: "数值边界",
      type_confusion: "类型混淆",
      missing_required_field: "缺失字段",
      malformed_auth: "鉴权异常",
      unexpected_method: "异常方法",
      rate_limit_or_replay: "限流/重放",
      schema_violation: "结构违规",
      other: "其他",
    },
  },
  en: {
    pass: "DEFENDED",
    fail: "BREACHED",
    noResponse: "NO RESPONSE",
    serverCrash: "SERVER CRASH",
    rejected: "REJECTED",
    accepted: "ACCEPTED",
    unknown: "UNKNOWN",
    fire: "fire_payload",
    httpStatus: "HTTP STATUS",
    latency: "LATENCY",
    verdict: "VERDICT",
    expected: "expected_behavior:",
    analysis: "analysis:",
    responsePreview: "response body preview",
    emptyResponse: "[empty response]",
    defenseScore: "SYS_DEFENSE_SCORE",
    defenseIntegrity: "Defense Integrity",
    total: "TOTAL",
    defended: "PASS",
    breached: "FAIL",
    crashRadar: "Crash Radar",
    noBreach: "NO BREACH",
    risks: "BREACHES",
    crashCopy:
      "Red rows indicate 5xx responses, leaked internals, timeouts, or accepted high-risk payloads.",
    logPath: "/var/log/chaos-runner",
    categories: {
      sql_injection: "SQL Injection",
      nosql_injection: "NoSQL Injection",
      oversized_payload: "Oversized Payload",
      unicode_edge_case: "Unicode Edge Case",
      numeric_boundary: "Numeric Boundary",
      type_confusion: "Type Confusion",
      missing_required_field: "Missing Field",
      malformed_auth: "Malformed Auth",
      unexpected_method: "Unexpected Method",
      rate_limit_or_replay: "Rate Limit / Replay",
      schema_violation: "Schema Violation",
      other: "Other",
    },
  },
} satisfies Record<UiLanguage, Record<string, unknown>>;

function getVerdictStyle(verdict: ChaosVerdict, language: UiLanguage) {
  const text = copy[language];

  return verdict === "PASS"
    ? {
        label: text.pass as string,
        text: "text-emerald-300",
        border: "border-emerald-400/40",
        bg: "bg-emerald-400/10",
        dot: "bg-emerald-300",
        shadow: "shadow-[0_0_24px_rgba(52,211,153,0.18)]",
      }
    : {
        label: text.fail as string,
        text: "text-red-300",
        border: "border-red-400/50",
        bg: "bg-red-500/10",
        dot: "bg-red-400",
        shadow: "shadow-[0_0_24px_rgba(248,113,113,0.2)]",
      };
}

function getStatusText(status: number | null, language: UiLanguage) {
  const text = copy[language];

  if (status === null) return text.noResponse as string;
  if (status >= 500) return text.serverCrash as string;
  if (status >= 400) return text.rejected as string;
  if (status >= 200) return text.accepted as string;
  return text.unknown as string;
}

function getCategoryLabel(category: string, language: UiLanguage) {
  const labels = copy[language].categories as Record<string, string>;

  return labels[category] ?? category;
}

function TerminalRow({
  item,
  index,
  language,
}: {
  item: ChaosTestResult;
  index: number;
  language: UiLanguage;
}) {
  const text = copy[language];
  const style = getVerdictStyle(item.verdict, language);

  return (
    <article className="grid min-w-0 gap-4 bg-black/20 p-3 transition hover:bg-cyan-300/[0.04] sm:p-4 2xl:grid-cols-[220px_1fr]">
      <div
        className={`rounded-md border ${style.border} ${style.bg} ${style.shadow} p-4`}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 font-mono text-xs font-bold ${style.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            {style.label}
          </span>
          <span className="font-mono text-xs text-slate-500">
            #{String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-4 font-mono text-xs uppercase text-slate-500">
          {getCategoryLabel(item.category, language)}
        </p>
        <p className="mt-1 break-words text-sm font-bold text-white">{item.test_name}</p>
      </div>

      <div className="min-w-0 font-mono text-sm">
        <p className="text-slate-500">
          <span className="text-cyan-300">$</span> {text.fire as string}{" "}
          <span className="text-yellow-200">--method {item.request.method}</span>{" "}
          <span className="break-all text-slate-300">{item.request.url}</span>
        </p>

        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
            <span className="text-slate-500">{text.httpStatus as string}</span>
            <p className="mt-1 break-words text-slate-100">
              {item.response.status ?? "NULL"} /{" "}
              {getStatusText(item.response.status, language)}
            </p>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
            <span className="text-slate-500">{text.latency as string}</span>
            <p className="mt-1 text-slate-100">{item.response.duration_ms}ms</p>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950 px-3 py-2">
            <span className="text-slate-500">{text.verdict as string}</span>
            <p className={`mt-1 ${style.text}`}>{item.verdict}</p>
          </div>
        </div>

        <div className="mt-3 rounded border border-slate-800 bg-slate-950/90 p-3">
          <p className="text-slate-500">
            {text.expected as string}
            <span className="ml-2 break-words text-slate-300">{item.expected_behavior}</span>
          </p>
          <p className="mt-2 text-slate-500">
            {text.analysis as string}
            <span className={`ml-2 break-words ${style.text}`}>{item.reason}</span>
          </p>
        </div>

        <details className="mt-3 rounded border border-cyan-300/10 bg-black/40">
          <summary className="cursor-pointer px-3 py-2 text-xs uppercase tracking-[0.18em] text-cyan-300 transition hover:text-cyan-100">
            {text.responsePreview as string}
          </summary>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words border-t border-cyan-300/10 p-3 text-xs leading-6 text-slate-300">
            {item.response.error ||
              item.response.body_preview ||
              (text.emptyResponse as string)}
          </pre>
        </details>
      </div>
    </article>
  );
}

export default function ChaosResultsDashboard({
  data,
  language,
}: ChaosResultsDashboardProps) {
  const defenseRate =
    data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
  const text = copy[language];

  return (
    <section className="flex flex-col gap-5">
      <div className="grid min-w-0 gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-lg border border-cyan-300/25 bg-slate-950/80 p-4 shadow-[0_0_48px_rgba(34,211,238,0.12)] sm:p-5">
          <div className="font-mono text-xs text-cyan-300/50 sm:absolute sm:right-4 sm:top-4">
            {text.defenseScore as string}
          </div>

          <div className="mt-3 flex flex-col gap-6 sm:mt-0 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.22em] text-slate-400">
                {text.defenseIntegrity as string}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-6xl font-black leading-none text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.4)] sm:text-7xl">
                  {defenseRate}
                </span>
                <span className="pb-2 text-3xl font-black text-emerald-300">%</span>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-md">
              <div className="rounded-md border border-slate-700 bg-black/30 p-3 sm:p-4">
                <p className="font-mono text-xs text-slate-500">
                  {text.total as string}
                </p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{data.total}</p>
              </div>
              <div className="rounded-md border border-emerald-400/35 bg-emerald-400/10 p-3 sm:p-4">
                <p className="font-mono text-xs text-emerald-300">
                  {text.defended as string}
                </p>
                <p className="mt-2 text-2xl font-black text-emerald-300 sm:text-3xl">
                  {data.passed}
                </p>
              </div>
              <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 sm:p-4">
                <p className="font-mono text-xs text-red-300">
                  {text.breached as string}
                </p>
                <p className="mt-2 text-2xl font-black text-red-300 sm:text-3xl">
                  {data.failed}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full border border-cyan-300/20 bg-slate-900">
            <div
              className="h-full bg-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.7)]"
              style={{ width: `${defenseRate}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-red-400/25 bg-[#10070a]/80 p-4 shadow-[0_0_42px_rgba(248,113,113,0.1)] sm:p-5">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-300">
            {text.crashRadar as string}
          </p>
          <p className="mt-4 break-words text-3xl font-black text-white sm:text-4xl">
            {data.failed === 0
              ? (text.noBreach as string)
              : language === "zh"
                ? `${data.failed} ${text.risks as string}`
                : `${data.failed} ${text.risks as string}`}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {text.crashCopy as string}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-cyan-300/20 bg-[#03060b]/95 shadow-[0_0_64px_rgba(34,211,238,0.1)]">
        <div className="flex flex-col gap-3 border-b border-cyan-300/20 bg-slate-950 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <p className="break-all font-mono text-xs uppercase tracking-[0.14em] text-cyan-300 sm:tracking-[0.2em]">
            {text.logPath as string}
          </p>
        </div>

        <div className="divide-y divide-cyan-300/10">
          {data.results.map((item, index) => (
            <TerminalRow
              key={`${item.test_name}-${index}`}
              item={item}
              index={index}
              language={language}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
