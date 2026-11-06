import type { SessionMessageAssistant, SessionMessageAssistantTool, SessionMessageInfo } from "@opencode/client"
import { Plugin, Slot, type MountedSession } from "@opencode/plugin/gui"
import { Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js"

interface Snapshot {
  live: boolean
  rate: number | null
  ttft: number | null
  generation: number | null
  output: number
  reasoning: number
  total: number
  cost: number | null
  model: string | null
  agent: string | null
}

interface Translator {
  t(key: string, params?: Record<string, string | number>): string
}

const definition = Plugin.define({
  i18n: {
    en: {
      "badge.rate": "t/s",
      "badge.ttft": "TTFT",
      "badge.pending": "measuring…",
      "tooltip.rate": "Tokens per second",
      "tooltip.rate.live": "live estimate from streamed text",
      "tooltip.rate.settled": "settled, from reported usage",
      "tooltip.ttft": "Time to first token",
      "tooltip.generation": "Generation time",
      "tooltip.output": "Output tokens",
      "tooltip.reasoning": "reasoning",
      "tooltip.total": "Session tokens",
      "tooltip.cost": "Cost",
      "tooltip.model": "Model",
      "tooltip.agent": "Agent",
    },
    zh: {
      "badge.rate": "t/s",
      "badge.ttft": "首字",
      "badge.pending": "测量中…",
      "tooltip.rate": "生成速度",
      "tooltip.rate.live": "按已流式文本估算",
      "tooltip.rate.settled": "按实际用量结算",
      "tooltip.ttft": "首 token 延迟",
      "tooltip.generation": "生成耗时",
      "tooltip.output": "输出 token",
      "tooltip.reasoning": "含推理",
      "tooltip.total": "会话 token",
      "tooltip.cost": "花费",
      "tooltip.model": "模型",
      "tooltip.agent": "代理",
    },
    "zh-CN": {
      "badge.rate": "t/s",
      "badge.ttft": "首字",
      "badge.pending": "测量中…",
      "tooltip.rate": "生成速度",
      "tooltip.rate.live": "按已流式文本估算",
      "tooltip.rate.settled": "按实际用量结算",
      "tooltip.ttft": "首 token 延迟",
      "tooltip.generation": "生成耗时",
      "tooltip.output": "输出 token",
      "tooltip.reasoning": "含推理",
      "tooltip.total": "会话 token",
      "tooltip.cost": "花费",
      "tooltip.model": "模型",
      "tooltip.agent": "代理",
    },
    "zh-TW": {
      "badge.rate": "t/s",
      "badge.ttft": "首字",
      "badge.pending": "測量中…",
      "tooltip.rate": "生成速度",
      "tooltip.rate.live": "依已串流文字估算",
      "tooltip.rate.settled": "依實際用量結算",
      "tooltip.ttft": "首 token 延遲",
      "tooltip.generation": "生成耗時",
      "tooltip.output": "輸出 token",
      "tooltip.reasoning": "含推理",
      "tooltip.total": "工作階段 token",
      "tooltip.cost": "花費",
      "tooltip.model": "模型",
      "tooltip.agent": "代理",
    },
  },
  setup(ctx) {
    const Metrics = (props: { session: MountedSession; active: boolean; compact: boolean }) => {
      const [now, setNow] = createSignal(Date.now())

      createEffect(() => {
        if (!props.active) return

        const timer = setInterval(() => setNow(Date.now()), 500)
        onCleanup(() => clearInterval(timer))
      })

      const snapshot = createMemo(() => readSnapshot(props.session, now()))

      return (
        <Show when={snapshot()}>
          {(value) => (
            <span
              title={tooltip(ctx, value())}
              aria-label={ariaLabel(ctx, value())}
              style={{
                display: "inline-flex",
                "align-items": "baseline",
                gap: "0.35em",
                "font-size": "11px",
                "font-variant-numeric": "tabular-nums",
                color: "inherit",
                opacity: "0.7",
                "white-space": "nowrap",
                "user-select": "none",
                cursor: "help",
              }}
            >
              <Show when={formatRate(value().rate)} fallback={<span>{ctx.t("badge.pending")}</span>}>
                {(rate) => (
                  <span>
                    {value().live ? "~" : ""}
                    {rate()} {ctx.t("badge.rate")}
                  </span>
                )}
              </Show>
              <Show when={!props.compact && formatLatency(value().ttft)}>
                {(ttft) => (
                  <span>
                    · {ctx.t("badge.ttft")} {ttft()}
                  </span>
                )}
              </Show>
            </span>
          )}
        </Show>
      )
    }

    ctx.add(Slot, {
      at: "session.header",
      order: 20,
      render: (input) => <Metrics session={input.session} active={input.active} compact={input.compact} />,
    })
  },
})

export default definition

function tooltip(ctx: Translator, value: Snapshot) {
  const lines: string[] = []
  const rate = formatRate(value.rate)
  const ttft = formatLatency(value.ttft)
  const generation = formatLatency(value.generation)

  if (rate) {
    lines.push(
      `${ctx.t("tooltip.rate")}: ${rate} ${ctx.t("badge.rate")} (${ctx.t(value.live ? "tooltip.rate.live" : "tooltip.rate.settled")})`,
    )
  }
  if (ttft) lines.push(`${ctx.t("tooltip.ttft")}: ${ttft}`)
  if (generation) lines.push(`${ctx.t("tooltip.generation")}: ${generation}`)

  const output = value.reasoning
    ? `${value.output.toLocaleString()} (${ctx.t("tooltip.reasoning")} ${value.reasoning.toLocaleString()})`
    : value.output.toLocaleString()
  lines.push(`${ctx.t("tooltip.output")}: ${output}`)
  lines.push(`${ctx.t("tooltip.total")}: ${value.total.toLocaleString()}`)

  if (value.cost != null) lines.push(`${ctx.t("tooltip.cost")}: ${formatCost(value.cost)}`)
  if (value.model) lines.push(`${ctx.t("tooltip.model")}: ${value.model}`)
  if (value.agent) lines.push(`${ctx.t("tooltip.agent")}: ${value.agent}`)

  return lines.join("\n")
}

function ariaLabel(ctx: Translator, value: Snapshot) {
  const rate = formatRate(value.rate)
  const ttft = formatLatency(value.ttft)

  return [rate ? `${rate} ${ctx.t("badge.rate")}` : ctx.t("badge.pending"), ttft ? `${ctx.t("badge.ttft")} ${ttft}` : null]
    .filter(Boolean)
    .join(", ")
}

function readSnapshot(session: MountedSession, now: number): Snapshot | undefined {
  const list = session.server.data.session.message.list(session.id)
  const message = lastAssistant(list)

  if (!message) return undefined

  const created = message.time.created
  const completed = message.time.completed
  const live = completed == null

  const reasoning = message.content.filter((part) => part.type === "reasoning")
  const reasoningStarts = reasoning.flatMap((part) => (part.time ? [part.time.created] : []))
  const earliestReasoning = reasoningStarts.length > 0 ? Math.min(...reasoningStarts) : undefined

  // `streamed` is set when the step's first streamed token arrives; reasoning parts
  // carry their own timestamps as a fallback.
  const firstToken = message.time.streamed ?? earliestReasoning
  const generationStart = minDefined([firstToken, earliestReasoning]) ?? created
  const generationEnd = completed ?? now

  const paused = toolPauses(message.content, generationStart, generationEnd)
  const generation = Math.max(0, generationEnd - generationStart - paused)

  const tokens = message.tokens
  const output = tokens?.output ?? 0
  const reasoningTokens = tokens?.reasoning ?? 0
  const total = (tokens?.input ?? 0) + output + reasoningTokens + (tokens?.cache.read ?? 0) + (tokens?.cache.write ?? 0)

  let rate: number | null = null

  if (!live && generation > 0) {
    rate = (output + reasoningTokens) / (generation / 1000)
  }

  if (live && generation >= 500) {
    const chars = message.content.reduce((sum, part) => sum + ("text" in part ? part.text.length : 0), 0)
    rate = chars / 4 / (generation / 1000)
  }

  return {
    live,
    rate,
    ttft: firstToken != null ? Math.max(0, firstToken - created) : null,
    generation: generation > 0 ? generation : null,
    output,
    reasoning: reasoningTokens,
    total,
    cost: message.cost ?? session.server.data.session.cost(session.id) ?? null,
    model: modelName(message.model),
    agent: message.agent ?? null,
  }
}

function lastAssistant(list: readonly SessionMessageInfo[]): SessionMessageAssistant | undefined {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const message = list[index]

    if (message?.type === "assistant") return message
  }

  return undefined
}

/**
 * Sums the time tools spent running inside the stream, so the rate reflects model
 * generation rather than tool execution. Overlapping tool runs count once.
 */
function toolPauses(content: SessionMessageAssistant["content"], start: number, end: number) {
  const intervals: Array<[number, number]> = []

  for (const part of content) {
    if (part.type !== "tool") continue

    const interval = toolInterval(part, start, end)
    if (interval) intervals.push(interval)
  }

  if (intervals.length === 0) return 0

  intervals.sort((left, right) => left[0] - right[0])

  let total = 0
  let current = intervals[0]!

  for (let index = 1; index < intervals.length; index += 1) {
    const next = intervals[index]!

    if (next[0] <= current[1]) {
      current = [current[0], Math.max(current[1], next[1])]
      continue
    }

    total += current[1] - current[0]
    current = next
  }

  total += current[1] - current[0]

  return total
}

function toolInterval(part: SessionMessageAssistantTool, start: number, end: number): [number, number] | undefined {
  const ran = part.time?.ran
  if (ran == null) return undefined

  const from = Math.max(start, ran)
  const to = Math.min(end, part.time.completed ?? (part.state?.status === "running" ? end : ran))

  return to > from ? [from, to] : undefined
}

function minDefined(values: Array<number | undefined>) {
  const defined = values.filter((value): value is number => value != null && Number.isFinite(value))
  return defined.length > 0 ? Math.min(...defined) : undefined
}

function modelName(model: SessionMessageAssistant["model"] | undefined): string | null {
  if (!model) return null

  return model.providerID ? `${model.providerID}/${model.id}` : model.id
}

function formatRate(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value >= 100) return Math.round(value).toFixed(0)
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

function formatLatency(value: number | null): string | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  if (value >= 10_000) return `${(value / 1000).toFixed(0)}s`
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${Math.round(value)}ms`
}

function formatCost(value: number): string {
  if (value > 0 && value < 0.01) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}
