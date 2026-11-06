# opencode-desktop-metrics

OpenCode Desktop 的 GUI 插件：在会话标题栏显示最近一次助手回复的 **生成速度（tokens/s）** 和 **首 token 延迟（TTFT）**，悬停查看 token 明细、生成耗时、花费和模型。

> 第三方插件，非 OpenCode 官方功能。GUI 插件 API 仍为 experimental。

## 显示效果

回复结束后，会话标题栏出现：

```text
23.4 t/s · 首字 0.83s
```

流式期间前缀 `~` 表示按已流式文本估算：

```text
~23.4 t/s · 首字 0.83s
```

标题栏过窄时自动只保留速度，悬停提示仍然完整。

悬停提示包含：

| 字段 | 含义 |
| --- | --- |
| 生成速度 | 输出 token + 推理 token ÷ 净生成时间 |
| 首 token 延迟 | 从 step 开始到第一个流式 token |
| 生成耗时 | 净生成时间，已扣除工具执行占用的时间 |
| 输出 token | 本 step 的输出量，括号内为推理 token |
| 会话 token | 输入 + 输出 + 推理 + 缓存读 + 缓存写 |
| 花费 | 本 step 费用；缺失时回退到会话累计费用 |
| 模型 / 代理 | `provider/model` 与 agent 名称 |

## 安装

要求 OpenCode Desktop 2.2.x。

### 从 GitHub 子目录安装

```sh
opencode plugin add 'github:clarklooking/opencode-v2-plugin#main::path:packages/desktop-metrics'
```

### 使用本地目录

```jsonc
// ~/.config/opencode/opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["E:/workspace/opencode-v2-plugin/packages/desktop-metrics"]
}
```

桌面端只读取 `opencode.json(c)`。保存后会自动重载，也可以在 **Settings → Extensions → Plugins** 里点 **Reload**。

安装后可在 **Settings → Extensions → Plugins** 看到 `opencode-desktop-metrics`，并单独开关它的桌面 UI。

## 指标计算方式

数据来自桌面端已同步的会话 store（`session.server.data.session.message`），不额外读取数据库，也不发起网络请求。

对最近一条 assistant step：

```text
首 token 延迟 = time.streamed - time.created
                 （缺失时回退到最早 reasoning part 的 time.created）

净生成时间   = time.completed - 最早生成时间 - 工具执行区间并集
生成速度     = (tokens.output + tokens.reasoning) / 净生成时间
```

- `time.streamed` 由服务端的 `session.step.streamed` 事件写入，表示 step 的第一个流式 token 到达时刻。
- 工具执行区间取每个 tool part 的 `time.ran` 到 `time.completed`，重叠部分只扣一次。
- 流式期间的估算速度使用已生成文本字符数 ÷ 4 作为 token 估算。
- 速度不包含缓存读写、输入 token，也不包含工具真正执行的时间。
- 缓存命中率、上下文占用百分比不在本插件范围内；那是桌面端内置圆环的职责。

## 兼容性与限制

- 按 OpenCode `2.2.5` 的类型构建，GUI 入口使用 `@opencode/plugin/gui`。
- 只显示**当前会话最近一条** assistant step。GUI 插件 API 提供 `session.header` 等 slot，但没有“每条消息下方”的 timeline slot，因此无法把指标插到每条消息的 footer。
- 桌面端自带的上下文用量圆环悬停内容由应用内置实现，插件无法注入；本插件是旁边新增的独立徽标。
- 多 step 的一次用户提问，会在下一个 step 开始时切换到新 step 的指标。

## 开发

```sh
npm install
npm run typecheck
npm run build
```

构建产物是单个 CommonJS 文件：`dist/gui-experimental.cjs`。仓库已提交该产物，因此用 Git 安装时不需要在本地再次构建。

目录：

```text
src/gui.tsx       插件定义、slot 注册、指标计算
vite.config.ts    使用 @opencode/plugin/gui 的 Vite preset
dist/             构建产物（提交到仓库）
```

## License

[MIT](../../LICENSE)
