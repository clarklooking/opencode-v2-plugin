import { Plugin } from "@opencode/plugin"
import { GoUsage } from "./rpc.js"

const ENDPOINT = "https://opencode.ai/zen/go/v1/usage"
const CACHE_MS = 20_000

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

function meter(value: unknown): Meter {
  const input = (value ?? {}) as { status?: unknown; percent?: unknown; resetsAt?: unknown }
  const percent =
    typeof input.percent === "number" && Number.isFinite(input.percent) ? input.percent : 0
  const parsed = typeof input.resetsAt === "string" ? Date.parse(input.resetsAt) : Number.NaN

  return {
    percent,
    limited: input.status === "rate-limited",
    resetsAt: Number.isFinite(parsed) ? parsed : Date.now(),
  }
}

export default Plugin.define({
  id: "go-usage",
  async setup(ctx) {
    let cache: { at: number; value: Payload } | undefined

    await ctx.rpc.register(GoUsage, {
      get: async (_input, { signal }) => {
        if (cache && Date.now() - cache.at < CACHE_MS) return cache.value

        try {
          const connection = await ctx.integration.connection.active("opencode-go")
          if (!connection) return { available: false, reason: "not-connected" }

          const credential = await ctx.integration.connection.resolve(connection)
          const token =
            credential?.type === "key"
              ? credential.key
              : credential?.type === "oauth"
                ? credential.access
                : undefined

          if (!token) return { available: false, reason: "no-key" }

          const response = await fetch(ENDPOINT, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            signal,
          })

          if (!response.ok) return { available: false, reason: `http-${response.status}` }

          const body = (await response.json()) as { usage?: Record<string, unknown> }
          if (!body.usage) return { available: false, reason: "invalid-response" }

          const value: Payload = {
            available: true,
            rolling: meter(body.usage.rolling),
            weekly: meter(body.usage.weekly),
            monthly: meter(body.usage.monthly),
            fetchedAt: Date.now(),
          }

          cache = { at: Date.now(), value }
          return value
        } catch {
          if (signal.aborted) return { available: false, reason: "aborted" }
          return { available: false, reason: "request-failed" }
        }
      },
    })
  },
})
