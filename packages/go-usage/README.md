# go-usage

OpenCode Desktop 插件：在窗口底部实时显示 **OpenCode Go 订阅额度**（5 小时 / 本周 / 本月）。

> 第三方插件，非 OpenCode 官方功能。GUI 插件 API 仍为 experimental。

## 功能

- 窗口底部状态条：`Go 额度充裕 | 5h ▮▮▮▮… | 周 ▮▮▮▮… | 月 ▮▮▮▮…`
- 每行 24 格，亮起的格子数 = 四舍五入后的**剩余**比例。
- 点击状态条打开详情：三个窗口的满宽分段条、剩余比例、重置时间、节奏判断。
- 命令面板搜索 `OpenCode Go 额度`。
- 详情对话框中可打开 Console 用量页面。
- 每 60 秒轮询一次；每次会话执行成功（`session.execution.succeeded`）后立即刷新；服务端缓存 20 秒。

## 数据来源

- `GET https://opencode.ai/zen/go/v1/usage`
- 使用本机已连接的 `opencode-go` 凭证，通过 OpenCode 插件 API 读取；不写入日志、不写入文件。
- 返回示例：

```json
{
  "usage": {
    "rolling": { "status": "ok", "percent": 0, "resetsAt": "2026-11-06T19:09:58.000Z" },
    "weekly": { "status": "ok", "percent": 7, "resetsAt": "2026-11-09T00:00:00.000Z" },
    "monthly": { "status": "ok", "percent": 4, "resetsAt": "2026-11-30T02:49:21.000Z" }
  }
}
```

`percent` 是该窗口已用百分比；`status` 为 `rate-limited` 时表示已限流。

## 安装

要求 OpenCode Desktop 2.2.x。

### 从 GitHub 子目录安装

```sh
opencode plugin add 'github:clarklooking/opencode-v2-plugin#main::path:packages/go-usage'
```

### 使用本地目录

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["E:/workspace/opencode-v2-plugin/packages/go-usage"]
}
```

> 注意：本插件 id 为 `go-usage`。如果本机已经通过 `file:///.../plugins/go-usage` 注册过同名插件，请先移除旧条目，再启用仓库版本；两个相同 id 的插件不能同时启用。

安装后可在 **Settings → Extensions → Plugins** 看到插件，并单独开关它的桌面 UI。

## 结构

```text
packages/go-usage/
├─ src/index.ts                # 服务端：读取凭证、请求上游、注册 RPC、缓存 20 秒
├─ src/rpc.ts                  # 服务端 ↔ GUI 的 RPC 契约
├─ src/gui.tsx                 # GUI：底部状态条 + 详情对话框 + 命令
├─ dist/gui-experimental.cjs   # Vite 预构建 GUI bundle（已提交）
└─ prototypes/                 # 设计原型（不随 npm 包发布）
```

## 构建

```sh
npm install
npm run build      # 生产构建
npm run dev        # 监听并自动重载
npm run typecheck  # 类型检查
```

升级 OpenCode Desktop 后建议重新构建：

```sh
npm install @opencode/plugin@<新版本>
npm run build
```

## 注意

- 上游 `/zen/go/v1/usage` 是 OpenCode 内部使用的接口，未在公开文档中承诺稳定性；如果接口变化，需要更新。
- 需要本机已通过 `/connect` 连接 `opencode-go`。
- `dist/gui-experimental.cjs` 必须保留在仓库中，否则通过 Git 安装时没有可加载的 GUI 入口。

## License

[MIT](../../LICENSE)
