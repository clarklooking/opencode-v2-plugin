# opencode-v2-plugin

OpenCode V2 插件集合 / A small collection of OpenCode V2 plugins.

## 插件列表

| 插件 | 简介 |
| --- | --- |
| [`desktop-metrics`](./packages/desktop-metrics) | 在 OpenCode Desktop 会话标题栏显示每次回复的生成速度（t/s）和首 token 延迟（TTFT），悬停可查看 token 明细、生成耗时、花费与模型。 |
| [`go-usage`](./packages/go-usage) | 在 OpenCode Desktop 窗口底部显示 OpenCode Go 订阅额度（5 小时 / 本周 / 本月），点击查看详情与重置时间。 |

## 安装 desktop-metrics

要求 OpenCode Desktop 2.2.x。GUI 插件 API 目前仍是 experimental，升级 OpenCode 后如遇加载问题请先执行 `npm run build` 重新构建。

从 GitHub 子目录安装（推荐）：

```sh
opencode plugin add 'github:clarklooking/opencode-v2-plugin#main::path:packages/desktop-metrics'
```

或者把本地目录写进全局配置 `~/.config/opencode/opencode.jsonc`：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["E:/workspace/opencode-v2-plugin/packages/desktop-metrics"]
}
```

桌面端只读取 `opencode.json(c)`，不读取 `cli.json`。配置保存后会自动重载；也可以在 **Settings → Extensions → Plugins** 里点 **Reload**。

卸载：

```sh
opencode plugin remove opencode-desktop-metrics
```

然后把对应条目从 `opencode.json(c)` 中删除。

## 安装 go-usage

```sh
opencode plugin add 'github:clarklooking/opencode-v2-plugin#main::path:packages/go-usage'
```

本地目录方式：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["E:/workspace/opencode-v2-plugin/packages/go-usage"]
}
```

> `go-usage` 的插件 id 是 `go-usage`。如果本机已经通过 `file:///.../plugins/go-usage` 注册过同名插件，请先移除旧条目，再启用仓库版本。

## 使用效果

每次助手回复结束后，会话标题栏（时间线标题行）会出现一行小字：

```text
23.4 t/s · 首字 0.83s
```

流式生成期间显示 `~23.4 t/s`，表示按已流式文本估算的速度。

鼠标悬停可看到完整信息：

```text
生成速度: 23.4 t/s (按实际用量结算)
首 token 延迟: 830ms
生成耗时: 52.60s
输出 token: 1,234 (含推理 321)
会话 token: 45,678
花费: $0.0123
模型: opencode-go/deepseek-v4.1-flash
代理: build
```

## 仓库结构

```text
opencode-v2-plugin/
├─ package.json                 # npm workspaces 根配置
├─ packages/
│  ├─ desktop-metrics/
│  │  ├─ src/gui.tsx            # t/s + TTFT 徽标
│  │  ├─ dist/gui-experimental.cjs
│  │  ├─ vite.config.ts
│  │  └─ package.json
│  └─ go-usage/
│     ├─ src/index.ts           # 服务端：读取凭证、请求上游、RPC
│     ├─ src/rpc.ts
│     ├─ src/gui.tsx            # 底部额度条 + 详情
│     ├─ dist/gui-experimental.cjs
│     ├─ prototypes/            # 设计原型
│     └─ package.json
└─ README.md
```

## 开发

```sh
npm install
npm run typecheck
npm run build
```

`npm run build` 会重新生成 `packages/desktop-metrics/dist/gui-experimental.cjs`。本地调试时在 `opencode.json(c)` 里直接指向 `packages/desktop-metrics`，并在桌面端 **Settings → Extensions → Plugins** 里重载即可。

## 说明

- 这是第三方插件，不是 OpenCode 官方功能。
- GUI 插件 API 标记为 experimental，后续 OpenCode 版本可能调整接口。
- 桌面端自带的“上下文用量圆环”悬停提示由应用内置实现，插件无法修改；本插件在会话标题栏增加独立徽标，因此不会覆盖或改动原有 UI。

## License

[MIT](./LICENSE)
