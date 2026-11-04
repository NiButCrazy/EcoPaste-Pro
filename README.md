<div align="center">

# EcoPaste-Pro（个人增强版）

**基于 [EcoPasteHub/EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 与 [3899/EcoPaste-Pro](https://github.com/3899/EcoPaste-Pro) 的 Windows 剪贴板工具个人分支**

[![Windows](https://img.shields.io/badge/平台-Windows-blue?style=flat-square)](https://github.com/NiButCrazy/EcoPaste-Pro/releases)
[![License](https://img.shields.io/github/license/NiButCrazy/EcoPaste-Pro?style=flat-square)](./LICENSE)
[![Version](https://img.shields.io/github/package-json/v/NiButCrazy/EcoPaste-Pro?style=flat-square)](https://github.com/NiButCrazy/EcoPaste-Pro/releases)
[![Downloads](https://img.shields.io/github/downloads/NiButCrazy/EcoPaste-Pro/total?style=flat-square)](https://github.com/NiButCrazy/EcoPaste-Pro/releases)

[下载最新版本](https://github.com/NiButCrazy/EcoPaste-Pro/releases/latest) · [问题反馈](https://github.com/NiButCrazy/EcoPaste-Pro/issues)

</div>

> 本文件只记录**本仓库相对上游新增或修改的功能**。剪贴板管理、内容识别、WebDAV 备份、局域网同步、存储统计等上游原有能力不再重复罗列，详见下方「与上游的关系」。

## ✨ 本仓库新增与修改

### 🔍 QuickLook 预览

- 新增「使用 QuickLook 预览」开关（偏好设置 → 通用 → 预览设置）。
- 开启后，按 `Space` 预览图片或文件时改为调用 QuickLook，通过内置的 `Bridge.exe` 完成预览。
- 需要本机正在运行 QuickLook；未开启时保持原有行为（图片用默认程序打开、文件在资源管理器中定位）。
- `Space` 预览同时支持文本条目中的 URL 链接与本地路径：链接用浏览器打开，路径在资源管理器中定位。

### 🖱️ 文件与图片拖拽

- 图片条目可直接拖出到桌面、聊天窗口等支持文件拖放的位置。
- 文件条目中的文件可直接拖出到资源管理器及其他应用（基于 `@crabnebula/tauri-plugin-drag`）。

### 📄 空状态页

- 列表为空时按当前分类显示对应提示，例如「暂无代码记录」「暂无图片记录」「搜索结果为空」等，不再是空白列表。

### ⌨️ 快捷键增强

| 快捷键 | 功能 |
| --- | --- |
| `Shift + C` | 复制当前选中条目 |
| `Alt + F` | 打开路径 / 在资源管理器中定位文件；系统指令直接执行 |
| `Ctrl + Q` | 显示 / 隐藏条目来源应用图标（默认隐藏） |
| `Ctrl + C` / `Ctrl + V` | 在条目内选中文本后，复制 / 粘贴选中的文本 |

> 选中文本的 `Ctrl + C` / `Ctrl + V` 在 Windows「不夺焦模式」下同样可用：窗口没有键盘焦点时由 Rust 低级键盘钩子拦截并转发，常规模式下则走页面内键盘事件。

### 🔊 新复制音效

- 替换为新的复制提示音；旧音效保留为 `copy.old.mp3`。

### 🎨 细节调整

- 文本选中高亮改为半透明蓝色，避免文字颜色被覆盖。
- 调整字数 / 文件数文案间距、来源图标默认隐藏等细节。
- 「关于」页面显示「魔改版」标识。

### 🛠️ 构建环境升级

- Vite 8 + `@vitejs/plugin-react` 6。
- 接入 React Compiler（`babel-plugin-react-compiler`），构建目标为 `esnext`。
- 同步更新相关构建依赖与锁文件。

## 📥 下载与安装

- 前往 [GitHub Releases](https://github.com/NiButCrazy/EcoPaste-Pro/releases/latest) 下载 Windows 安装包（NSIS `.exe`）。
- 本分支已禁用自动更新，升级时请手动下载新版本覆盖安装。

## 💻 本地构建

环境要求：Windows 10 1809+ / Windows 11、Node.js 18+（推荐 20 / 22）、pnpm、Rust stable（`x86_64-pc-windows-msvc`）、Visual Studio C++ 生成工具、WebView2 Runtime。

```bash
pnpm install

pnpm tauri dev      # 开发调试
pnpm tauri build    # 构建安装包
```

构建产物位于 `target/release/bundle/nsis/`。

## 🔗 与上游的关系

本仓库是 [3899/EcoPaste-Pro](https://github.com/3899/EcoPaste-Pro) 的个人增强分支，后者是 [EcoPasteHub/EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 的 Windows 增强版本。

以下能力来自上游，本仓库未做改动：

- 剪贴板历史记录、搜索、收藏、分组与多种内容类型识别
- WebDAV 云端备份与自动备份调度
- 局域网 HTTP 接收、Webhook / Bark 推送与防回环处理
- 存储统计、数据库维护与清理
- Windows 不夺焦窗口、Win+V 接管、鼠标中键 / 双击修饰键唤醒等

上游文档与说明请参考：

- [EcoPaste 官方仓库](https://github.com/EcoPasteHub/EcoPaste)
- [EcoPaste-Pro 上游仓库](https://github.com/3899/EcoPaste-Pro)

## 📄 开源许可

本项目基于 [GPL-3.0](./LICENSE) 开源，与上游项目保持一致。

## 🙏 致谢

- 感谢 [EcoPasteHub/EcoPaste](https://github.com/EcoPasteHub/EcoPaste) 提供的优秀底座与设计。
- 感谢 [3899/EcoPaste-Pro](https://github.com/3899/EcoPaste-Pro) 提供的 Windows 增强实现。
