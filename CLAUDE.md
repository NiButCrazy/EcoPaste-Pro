# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

EcoPaste-Pro 是 [EcoPasteHub/EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 的 Fork 增强分支，一个面向 **Windows** 的剪贴板管理工具，基于 **Tauri v2 + React 18 + TypeScript + Vite**。相较原版新增/重构了 WebDAV 备份、局域网数据互传、存储统计、12 类内容识别与 Windows 原生窗口/快捷键能力。项目代码、注释与文档均以中文为主，UI 文案通过 i18n 管理。

`docs/` 下有安装、环境、开发者、同步、更新日志等中文文档。注意文档可能落后于实现（例如数据库实际文件名为 `EcoPaste.db`，而非文档中的 `data.db`）；**以代码为准**。

## 常用命令

```bash
pnpm install                 # 强制使用 pnpm（preinstall 有 only-allow 校验）

pnpm tauri dev               # 完整桌面端调试（beforeDevCommand 会先执行 pnpm dev：生成图标 + 启动 Vite）
pnpm dev:vite                # 仅启动前端 Vite（127.0.0.1:1420），Tauri API 不可用，只适合调样式
pnpm dev                     # 等价于 build:icon + dev:vite，一般由 tauri dev 自动调用

pnpm build                   # build:icon + vite 生产构建
pnpm tauri build             # 打包（NSIS/MSI 等），产物在仓库根目录 target/release/bundle/
pnpm tauri build --target x86_64-pc-windows-msvc   # CI 使用的显式目标，产物在 target/x86_64-pc-windows-msvc/release/bundle/

pnpm lint                    # biome check --write src（只检查/修复 src，不含 Rust）
npx tsx --test src/utils/webdavRetention.test.ts   # 运行现有 node:test 单元测试（项目未配置 vitest/test script）
pnpm release                 # release-it 发版；after:bump 会同步 Cargo.toml/Cargo.lock 中的版本号
pnpm release-beta            # 预发布版本
```

提交规范：Commitlint（Conventional Commits），pre-commit 由 lint-staged 对 `**.{ts,tsx,json}` 执行 `biome check --write`。

构建环境（见 `docs/developer.md`）：Windows 10 1809+ / 11、VS C++ 生成工具、Rust stable（`x86_64-pc-windows-msvc`）、Node.js 18+（CI 用 22）、pnpm、WebView2。

## 架构

### 双窗口与跨窗口状态同步

- `src-tauri/tauri.conf.json` 定义两个隐藏窗口：`main`（360×600，置顶、透明、无边框、跳过任务栏）和 `preference`（700×480）。前端用 hash 路由：`index.html/#/` 与 `index.html/#/preference`（`src/router/index.ts`）。
- 关闭窗口时 `lib.rs` 拦截 `CloseRequested` 改为 `hide()`，应用常驻后台；托盘由前端 `src/hooks/useTray.ts` 创建。
- 状态管理使用 Valtio（`src/stores/{clipboard,global,transfer}.ts`）。**两个窗口是独立 webview，各自持有一份 store**：Preference 订阅三个 store，变更时 `emit(LISTEN_KEY.STORE_CHANGED, ...)` 并 `saveStore()` 落盘；Main 监听该事件后用 `strictDeepAssign` 合并。因此新增配置项需要同步改：`src/types/store.d.ts` 类型、store 默认值、Preference UI；事件名集中在 `src/constants/index.ts` 的 `LISTEN_KEY`。
- `strictDeepAssign`（`src/utils/object.ts`）只合并目标中已存在的键，用于向下降级时丢弃未来版本字段；恢复本地配置用 `deepAssign`。
- 持久化路径（`src/utils/path.ts`）：数据根目录 `globalStore.env.saveDataDir`（默认 appDataDir）；数据库 `<saveDataDir>/EcoPaste.db`（dev 为 `EcoPaste.dev.db`）；图片 `images/`、图标 `icons/`；配置为 appDataDir 下 `.store.json`（dev `.store.dev.json`），备份为 `<saveDataDir>/.store-backup.json`；窗口位置单独存 `.window-state.json`。

### 剪贴板采集流水线

`src/hooks/useClipboard.ts` 是录入口的核心：

1. `tauri-plugin-clipboard-x` 监听剪贴板变化，并用 Rust 命令 `get_clipboard_sequence_number` 做 Windows 序列号去重（返回 0 时不拦截）。
2. 内容优先级：files（全为图片且有图像数据时归为 image）→ image → html → rtf → text；`useClipboard` 内对 Excel/WPS 复制表格时同时出现 image+html 的情况有专门启发式判定，并清理孤儿图片文件。
3. 文本子类型分类在 `src/plugins/clipboard.ts` 的 `getClipboardTextSubtype`：URL/邮箱/颜色/路径/系统指令/Markdown/代码；Windows 专用识别在 `src/utils/winPaths.ts`（`%VAR%`、`shell:`、盘符/UNC、Win+R 指令），代码检测在 `src/utils/isCode.ts`。
4. 按 `(type, value)` 查重后 insert 或 update；图片记录入库时 `value` 存文件名，列表中拼接图片目录；文件类型 `value` 存 JSON 字符串。
5. 内部写入（粘贴回声）通过 `markInternalClipboardWrite()` 设置 `window.__isEcoPastePasting` / `__isEcoPasteImageEcho` 抑制重复录入，数据传输另有 `src/utils/transferFingerprint.ts` 防回环指纹。新增粘贴/写入路径时必须考虑回声抑制。

内容分类是两套需要保持同步的逻辑：`src/constants/contentTypes.ts` 的 12 类标签与 `getTypeDbCondition`，以及 `src/hooks/useHistoryList.ts` 中手写的过滤条件；改动分类筛选时两处都要改。

### 数据库

- Kysely + `TauriSqliteDialect`，表结构在运行时由 `src/database/index.ts` 创建，**没有使用 Tauri SQL migrations**。
- `historyColumnDefs` 是列定义的唯一事实来源，建表与 `selectHistory` 的 `.select()` 共用；新增列时在数组中加定义，并仿照现有代码用 `alterTable(...).addColumn(...)` 容错迁移 + 必要时回填旧数据。新增查询索引同样在该文件创建。
- 查询封装在 `src/database/history.ts`。批量删除 ≥50 条会触发 `PRAGMA optimize` + `VACUUM`（`maintainDatabaseAfterDelete`），并通过 `maintenancePromise` 串行化重型维护。

### Rust 后端

- 根目录 `Cargo.toml` 是 workspace（`src-tauri` 为成员），构建产物在仓库根 `target/`。`src-tauri/src/lib.rs` 负责插件装配；版本号需与 `package.json` 一致（由 `scripts/release.ts` 发版时同步）。
- 自定义插件以独立 crate 形式放在 `src-tauri/src/plugins/{window,paste,autostart,webdav,transfer}`，通过根 `Cargo.toml` 的 path 依赖引入：`tauri-plugin-eco-window`、`eco-paste`、`eco-autostart`、`eco-webdav`、`transfer`。
- 前端调用约定为 `invoke("plugin:<插件名>|<command>")`，普通封装放在 `src/plugins/*.ts`（如 `window.ts`、`paste.ts`、`webdav.ts`）。给自定义插件加 command 时还需同步 build.rs / `permissions/` 与 `src-tauri/capabilities/default.json` 中的权限。
- `src-tauri/src/core/shortcut_hook.rs` 用 Win32 低级钩子实现：Win+V 接管、双击 Ctrl/Alt/Shift 唤醒、鼠标中键触发；通过 `win_v_takeover_trigger`、`double_modifier_trigger`、`mbutton-triggered` 事件通知前端。前端 `src/hooks/useRegister.ts` 对这些虚拟快捷键（`Command+V`、`Double_*`）做了特殊分支，不走 global-shortcut 插件注册。
- `src-tauri/src/core/source_app.rs` 通过剪贴板 owner 窗口 → 进程路径 → 应用名，并用 `file_icon_provider` 生成 base64 PNG 图标。
- **本 Fork 已禁用 updater 插件**（`lib.rs` 中注册被注释，`tauri.conf.json` 有 `_updater_disabled` 说明），不要误启用，以免与官方版本冲突。
- `src-tauri/assets/Bridge.exe` 作为资源打包，前端通过 `resolveResource("assets/Bridge.exe")` 调用它实现 QuickLook 预览（图片/文件）。

### 前端约定

- `@` 别名指向 `src/`；Ant Design 5 + UnoCSS + 少量 SCSS Modules。UnoCSS 主题色映射到 antd CSS 变量（`uno.config.ts`），支持 `bg-color-1`、`text-color-2` 等快捷类；深色模式通过 `<html>` 上的 `dark` class + antd 算法切换。
- i18n 提供 `zh-CN`（fallback）、`zh-TW`、`en-US`、`ja-JP`，键为嵌套结构（`src/locales/`）；新增文案需四份语言文件同步。antd locale 在 `src/locales/index.ts` 映射。
- Biome 规则较严格：`noConsole` 为 error（确需输出时用 `biome-ignore` 注释，或使用 `@tauri-apps/plugin-log`）、UnoCSS class 自动排序、import/JSON key 自动排序；`pnpm lint` 不会检查 `src-tauri`。
- 已启用 React Compiler（`vite.config.ts` 中 babel 插件），依赖自动 memo 化；保持标准 Hooks 规则即可。
- Vite 固定端口 1420 且 `strictPort: true`，并忽略监听 `src-tauri/`。

## CI 与发布

`.github/workflows/build-on-sync.yml` 在 Windows runner 上构建 x64 NSIS 安装包（`pnpm install --frozen-lockfile` → `pnpm tauri build --target x86_64-pc-windows-msvc`），并创建 prerelease。CI **不运行测试或 lint**，提交前请自行执行 `pnpm lint` 与相关单测。

## 其他

- 保持中文注释与文案风格；用户可见字符串走 i18n，Rust/配置中的命令名、事件名、键名不要翻译。
- 发版版本号以 `package.json` 为准；`tauri.conf.json` 的 `version` 指向 `../package.json`。
- 现有单元测试只有 `src/utils/webdavRetention.test.ts`（`node:test` + `tsx`），新增纯函数测试可沿用该方式。
