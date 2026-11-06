import { Rpc } from "@opencode/plugin/rpc"

const meter = {
  type: "object",
  properties: {
    percent: { type: "number" },
    limited: { type: "boolean" },
    resetsAt: { type: "number" },
  },
  required: ["percent", "limited", "resetsAt"],
  additionalProperties: false,
} as const

export const GoUsage = Rpc.define({
  id: "go-usage",
  methods: {
    get: {
      input: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          available: { type: "boolean" },
          reason: { type: "string" },
          rolling: meter,
          weekly: meter,
          monthly: meter,
          fetchedAt: { type: "number" },
        },
        required: ["available"],
        additionalProperties: false,
      },
    },
  },
  events: {},
})
