import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { Command, createKeyed, Plugin, Slot, Style } from "@opencode/plugin/gui"
import { GoUsage } from "./rpc"

type Meter = {
  percent: number
  limited: boolean
  resetsAt: number
}

type Payload =
  | {
      available: true
      rolling: Meter
      weekly: Meter
      monthly: Meter
      fetchedAt: number
    }
  | {
      available: false
      reason: string
    }

type Window = {
  key: "rolling" | "weekly" | "monthly"
  label: string
  short: string
  remaining: number
  limited: boolean
  resetsAt: number
  pace?: number
}

const TICKS = 24
const CARD_TICKS = 72
const CONSOLE_URL = "https://opencode.ai/console"
const REFRESH_MS = 60_000

const CSS = `
.go-usage-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}
.go-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color 140ms ease;
}
.go-chip:hover {
  background: color-mix(in srgb, currentColor 7%, transparent);
}
.go-chip:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 2px;
}
.go-brand {
  width: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.035em;
  opacity: 0.72;
}
.go-muted {
  font-size: 10.5px;
  opacity: 0.55;
}
.go-divider {
  width: 1px;
  height: 14px;
  flex: none;
  background: color-mix(in srgb, currentColor 11%, transparent);
}
.go-meter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 9px;
  flex: none;
}
.go-meter > b {
  width: 15px;
  text-align: right;
  font-size: 9px;
  line-height: 1;
  font-weight: 500;
  opacity: 0.55;
}
.go-ticks {
  display: block;
  width: var(--ticks-w, 35px);
  height: 9px;
  flex: none;
}
.go-chev {
  width: 8px;
  text-align: center;
  font-size: 13px;
  line-height: 1;
  opacity: 0.45;
}
.go-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 300px;
}
.go-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.go-detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
}
.go-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  background: color-mix(in srgb, #2f9e6b 12%, transparent);
  color: #257d54;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.go-detail-sub {
  margin: -3px 0 8px;
  font-size: 10px;
  opacity: 0.5;
}
.go-detail-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 38px 86px;
  align-items: center;
  gap: 9px;
  height: 28px;
  font-size: 10.5px;
}
.go-detail-label { opacity: 0.65; }
.go-detail-percent {
  text-align: right;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}
.go-detail-reset {
  text-align: right;
  font-size: 9.5px;
  opacity: 0.45;
}
.go-row-ticks {
  display: block;
  width: 100%;
  height: 10px;
}
.go-pace {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  background: color-mix(in srgb, currentColor 4%, transparent);
  font-size: 10.5px;
  line-height: 1.5;
  opacity: 0.8;
}
.go-pace b { font-weight: 600; opacity: 1; }
.go-pace svg { flex: none; color: #3ba974; }
.go-detail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, currentColor 8%, transparent);
  font-size: 10px;
  opacity: 0.55;
}
.go-detail-link { color: #257d54; opacity: 1; }
.go-detail-empty {
  padding: 6px 0 10px;
  font-size: 12px;
  opacity: 0.6;
}
`

function filledTicks(remaining: number, count = TICKS) {
  const clamped = Math.max(0, Math.min(100, remaining))
  return Math.round((clamped / 100) * count)
}

function resetText(resetsAt: number) {
  const diff = resetsAt - Date.now()
  if (!Number.isFinite(diff) || diff <= 0) return "即将重置"

  const minutes = Math.ceil(diff / 60_000)
  if (minutes < 60) return `${minutes} 分钟后重置`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时后重置`

  return `${Math.floor(hours / 24)} 天后重置`
}

function reasonText(reason: string | undefined) {
  switch (reason) {
    case "not-connected":
      return "未连接 OpenCode Go"
    case "no-key":
      return "未找到 Go API Key"
    case "request-failed":
      return "读取失败"
    case "invalid-response":
      return "返回格式异常"
    case "aborted":
      return "已取消"
    default:
      return reason?.startsWith("http-") ? `服务返回 ${reason.slice(5)}` : "额度暂不可用"
  }
}

function statusOf(windows: Window[], available: boolean) {
  if (!available) return { text: "读取中…", tone: "idle" as const }
  if (!windows.length) return { text: "暂无数据", tone: "idle" as const }

  const min = Math.min(...windows.map((window) => window.remaining))
  if (windows.some((window) => window.limited)) return { text: "额度用尽", tone: "danger" as const }
  if (min >= 60) return { text: "额度充裕", tone: "ok" as const }
  if (min >= 30) return { text: "用量平稳", tone: "ok" as const }
  if (min >= 10) return { text: "注意用量", tone: "warn" as const }
  return { text: "接近上限", tone: "danger" as const }
}

function paceOf(windows: Window[]) {
  if (windows.some((window) => window.limited)) {
    return { short: "已限流", detail: "当前窗口已限流，等待重置或切换模型。" }
  }

  if (windows.some((window) => window.remaining < 10)) {
    return {
      short: "接近上限",
      detail: "余量接近上限，建议切换免费模型或等待重置。",
    }
  }

  const deltas = windows
    .map((window) => window.pace)
    .filter((value): value is number => typeof value === "number")

  if (!deltas.length) return { short: "余量充足", detail: "节奏数据积累中，先按余量显示。" }

  const max = Math.max(...deltas)
  if (max > 10) {
    return {
      short: "节奏偏快",
      detail: "节奏偏快。按当前速度可能会在重置前用完。",
    }
  }
  if (max < -10) {
    return {
      short: "可用到重置",
      detail: "节奏从容。按当前速度可以用到重置，不必收着用。",
    }
  }
  return { short: "节奏正常", detail: "节奏正常。按当前速度刚好用到重置。" }
}

export default Plugin.define({
  setup(ctx) {
    const [usage, setUsage] = createSignal<Payload>()
    const [loading, setLoading] = createSignal(true)
    const ui = ctx.ui

    const available = createMemo(() => {
      const current = usage()
      return current?.available ? current : undefined
    })

    const fallbackReason = () => {
      const current = usage()
      return current && !current.available ? current.reason : undefined
    }

    const windows = createMemo<Window[]>(() => {
      const data = available()
      if (!data) return []

      const now = Date.now()
      const build = (
        key: Window["key"],
        label: string,
        short: string,
        meter: Meter,
        windowMs: number,
      ): Window => {
        const remaining = Math.max(0, Math.min(100, 100 - meter.percent))
        const elapsed = Math.max(0, Math.min(1, 1 - (meter.resetsAt - now) / windowMs))
        const pace = elapsed < 0.03 ? undefined : 100 - remaining - elapsed * 100

        return {
          key,
          label,
          short,
          remaining,
          limited: meter.limited,
          resetsAt: meter.resetsAt,
          pace,
        }
      }

      return [
        build("rolling", "5 小时", "5h", data.rolling, 5 * 60 * 60 * 1000),
        build("weekly", "本周", "周", data.weekly, 7 * 24 * 60 * 60 * 1000),
        build("monthly", "本月", "月", data.monthly, 30 * 24 * 60 * 60 * 1000),
      ]
    })

    const status = createMemo(() => statusOf(windows(), !!available()))
    const pace = createMemo(() => paceOf(windows()))
    const stateDetail = (window: Window) =>
      window.limited
        ? "已限流"
        : `剩余 ${Math.round(window.remaining)}% · ${resetText(window.resetsAt)}`

    const refresh = async () => {
      try {
        setUsage((await ctx.client.rpc(GoUsage).get({})) as Payload)
      } catch {
        // Keep the last known value while the server restarts or is unreachable.
      } finally {
        setLoading(false)
      }
    }

    void refresh()

    const timer = setInterval(() => void refresh(), REFRESH_MS)
    onCleanup(() => clearInterval(timer))

    createKeyed(
      () => ctx.servers.get("sidecar")?.data,
      (data) => onCleanup(data.on("session.execution.succeeded", () => void refresh())),
    )

    const tickIndexes = Array.from({ length: TICKS }, (_, index) => index)
    const VB_WIDTH = TICKS * 3 - 1
    const VB_HEIGHT = 9
    const cardIndexes = Array.from({ length: CARD_TICKS }, (_, index) => index)
    const CARD_VB_WIDTH = CARD_TICKS * 3 - 1

    const Ticks = (props: { remaining: number; tone?: string }) => {
      let ref: SVGSVGElement | undefined

      const apply = () => {
        const el = ref
        if (!el) return

        const dpr = window.devicePixelRatio || 1
        const width = VB_WIDTH / dpr

        el.style.setProperty("--ticks-w", `${width}px`)

        el.style.transform = "none"
        const rect = el.getBoundingClientRect()
        const dx = Math.round(rect.left * dpr) / dpr - rect.left
        if (Math.abs(dx) > 0.001) el.style.transform = `translateX(${dx}px)`
      }

      onMount(() => {
        apply()
        const observer = new ResizeObserver(apply)
        if (ref) observer.observe(ref)
        window.addEventListener("resize", apply)

        onCleanup(() => {
          observer.disconnect()
          window.removeEventListener("resize", apply)
        })
      })

      const onColor = () =>
        props.tone === "danger" ? "#cf4a42" : props.tone === "warn" ? "#d89a2b" : "#3aa974"

      return (
        <svg
          ref={ref}
          class="go-ticks"
          viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
          preserveAspectRatio="none"
          shape-rendering="crispEdges"
          aria-hidden="true"
        >
          <For each={tickIndexes}>
            {(index) => (
              <rect
                x={index * 3}
                y="0"
                width="2"
                height={VB_HEIGHT}
                fill={index < filledTicks(props.remaining) ? onColor() : "currentColor"}
                fill-opacity={index < filledTicks(props.remaining) ? "1" : "0.12"}
              />
            )}
          </For>
        </svg>
      )
    }

    const WideTicks = (props: { remaining: number; tone?: string }) => {
      const onColor = () =>
        props.tone === "danger" ? "#cf4a42" : props.tone === "warn" ? "#d89a2b" : "#3aa974"

      return (
        <svg
          class="go-row-ticks"
          viewBox={`0 0 ${CARD_VB_WIDTH} ${VB_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <For each={cardIndexes}>
            {(index) => (
              <rect
                x={index * 3}
                y="0"
                width="2"
                height={VB_HEIGHT}
                fill={
                  index < filledTicks(props.remaining, CARD_TICKS)
                    ? onColor()
                    : "currentColor"
                }
                fill-opacity={
                  index < filledTicks(props.remaining, CARD_TICKS) ? "1" : "0.12"
                }
              />
            )}
          </For>
        </svg>
      )
    }

    const Details = (props: { close: () => void }) => (
      <ui.Dialog
        title="OpenCode Go 额度"
        size="normal"
        footer={
          <>
            <ui.Button variant="ghost" onClick={() => ctx.system.openExternal(CONSOLE_URL)}>
              打开控制台
            </ui.Button>
            <ui.Button variant="contrast" onClick={props.close}>
              关闭
            </ui.Button>
          </>
        }
      >
        <Show
          when={available()}
          fallback={
            <div class="go-detail-empty">
              {loading() ? "正在读取…" : reasonText(fallbackReason())}
            </div>
          }
        >
          <div class="go-detail">
            <div class="go-detail-head">
              <span class="go-detail-title">
                <span class="go-mark">GO</span>
                OpenCode Go
              </span>
            </div>
            <div class="go-detail-sub">剩余额度</div>
            <For each={windows()}>
              {(window) => (
                <div class="go-detail-row">
                  <span class="go-detail-label">{window.label}</span>
                  <WideTicks
                    remaining={window.remaining}
                    tone={status().tone === "ok" ? undefined : status().tone}
                  />
                  <span class="go-detail-percent">{Math.round(window.remaining)}%</span>
                  <span class="go-detail-reset">
                    {window.limited ? "已限流" : resetText(window.resetsAt)}
                  </span>
                </div>
              )}
            </For>
            <div class="go-pace">
              <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.5 8.5 6.4 11.4 12.5 4.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{pace().detail}</span>
            </div>
            <div class="go-detail-foot">
              <span>剩余比例，不是已用</span>
              <span class="go-detail-link">在 Console 查看 →</span>
            </div>
          </div>
        </Show>
      </ui.Dialog>
    )

    const openDetails = () => {
      ctx.dialogs.open((dialog) => <Details close={dialog.close} />)
    }

    const Bar = () => (
      <div class="go-usage-bar">
        <button
          class="go-chip"
          data-tone={status().tone}
          aria-label={`OpenCode Go，${status().text}`}
          title={windows().map((window) => `${window.label} ${stateDetail(window)}`).join(" · ")}
          onClick={() => openDetails()}
        >
          <span class="go-brand">Go</span>
          <Show
            when={windows().length > 0}
            fallback={
              <>
                <span class="go-muted">
                  {loading() ? "读取中…" : reasonText(fallbackReason())}
                </span>
                <span class="go-chev">›</span>
              </>
            }
          >
            <span class="go-divider" />
            <For each={windows()}>
              {(window) => (
                <span class="go-meter" title={`${window.label} · ${stateDetail(window)}`}>
                  <b>{window.short}</b>
                  <Ticks
                    remaining={window.remaining}
                    tone={status().tone === "ok" ? undefined : status().tone}
                  />
                </span>
              )}
            </For>
            <span class="go-chev">›</span>
          </Show>
        </button>
      </div>
    )

    ctx.add(Style, CSS)

    ctx.add(Command, () => ({
      id: "show",
      title: "OpenCode Go 额度",
      keywords: "go usage quota allowance 额度",
      run: () => openDetails(),
    }))

    ctx.add(Slot, { at: "window.bottom", render: () => <Bar /> })
  },
})
