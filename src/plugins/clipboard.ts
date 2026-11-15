import { emit } from "@tauri-apps/api/event";
import { exists } from "@tauri-apps/plugin-fs";
import {
  writeFiles,
  writeHTML,
  writeImage,
  writeRTF,
  writeText,
} from "tauri-plugin-clipboard-x-api";
import { LISTEN_KEY } from "@/constants";
import { updateHistory } from "@/database/history";
import { clipboardStore } from "@/stores/clipboard";
import type { DatabaseSchemaHistory } from "@/types/database";
import { resolveAudioSource } from "@/utils/audio";
import { formatDate } from "@/utils/dayjs";
import { isColor, isEmail, isMarkdown, isURL } from "@/utils/is";
import { detectCode } from "@/utils/isCode";
import { isEnvPath, isShellPath, isSysCommand } from "@/utils/winPaths";
import { paste } from "./paste";
import { hideWindow } from "./window";

let pasteAudioElement: HTMLAudioElement | null = null;
let pasteAudioSrc = "";

export const playPasteSound = () => {
  if (!clipboardStore.audio.paste || typeof Audio === "undefined") return;

  const src = resolveAudioSource(clipboardStore.audio.pasteSource, "toggle");

  if (!pasteAudioElement) {
    pasteAudioElement = new Audio();
  }

  if (pasteAudioSrc !== src) {
    pasteAudioSrc = src;
    pasteAudioElement.src = src;
  }

  pasteAudioElement.currentTime = 0;
  pasteAudioElement.play().catch(() => {});
};

export const getClipboardTextSubtype = async (value: string) => {
  try {
    const trimmedValue = value.trim();

    if (isURL(trimmedValue)) {
      return "url";
    }

    if (isEmail(trimmedValue)) {
      return "email";
    }

    if (isColor(trimmedValue)) {
      return "color";
    }

    // Windows 特殊路径与指令检测
    if (isEnvPath(trimmedValue) || isShellPath(trimmedValue)) {
      return "path";
    }

    if (isSysCommand(trimmedValue)) {
      return "command";
    }

    if (await exists(trimmedValue)) {
      return "path";
    }

    // Markdown detection: check for common markdown patterns
    if (isMarkdown(trimmedValue)) {
      return "markdown";
    }

    const codeDetect = detectCode(trimmedValue);
    if (codeDetect.isCode && codeDetect.language) {
      return `code_${codeDetect.language}`;
    }
  } catch {
    return;
  }
};

// 仅抑制复制音效，不影响内部写入/回声拦截与历史记录逻辑
export const markCopySoundSuppressed = (isImage = false) => {
  (window as any).__ecoPasteSuppressCopySound = true;
  if ((window as any).__ecoPasteSoundTimeout) {
    clearTimeout((window as any).__ecoPasteSoundTimeout);
  }
  // 兜底：若写入没有触发剪贴板事件，避免标记长期残留
  (window as any).__ecoPasteSoundTimeout = setTimeout(() => {
    (window as any).__ecoPasteSuppressCopySound = false;
  }, 1000);

  // 图片可能会延迟数秒后再次触发剪贴板事件，需要更长的兜底窗口
  if (isImage) {
    (window as any).__ecoPasteImageSuppressCopySound = true;
    if ((window as any).__ecoPasteImageSoundTimeout) {
      clearTimeout((window as any).__ecoPasteImageSoundTimeout);
    }
    (window as any).__ecoPasteImageSoundTimeout = setTimeout(() => {
      (window as any).__ecoPasteImageSuppressCopySound = false;
    }, 3000);
  }
};

// 由下一次剪贴板事件消费：只压制这一次写入的音效
export const isCopySoundSuppressed = () => {
  const win = window as any;
  const suppressed =
    win.__ecoPasteSuppressCopySound || win.__ecoPasteImageSuppressCopySound;

  if (!suppressed) return false;

  win.__ecoPasteSuppressCopySound = false;
  win.__ecoPasteImageSuppressCopySound = false;
  if (win.__ecoPasteSoundTimeout) clearTimeout(win.__ecoPasteSoundTimeout);
  if (win.__ecoPasteImageSoundTimeout) {
    clearTimeout(win.__ecoPasteImageSoundTimeout);
  }

  return true;
};

export const markInternalClipboardWrite = (
  isImage = false,
  action: "copy" | "paste" = "copy",
) => {
  if (action === "paste") {
    markCopySoundSuppressed(isImage);
  }

  (window as any).__isEcoPastePasting = true;
  if ((window as any).__ecoPastePasteTimeout) {
    clearTimeout((window as any).__ecoPastePasteTimeout);
  }
  (window as any).__ecoPastePasteTimeout = setTimeout(() => {
    (window as any).__isEcoPastePasting = false;
  }, 1000);

  // 图片粘贴时，插件可能会延迟数秒后再次触发事件，需要更长的保护窗口
  if (isImage) {
    (window as any).__isEcoPasteImageEcho = true;
    if ((window as any).__ecoPasteImageTimeout) {
      clearTimeout((window as any).__ecoPasteImageTimeout);
    }
    (window as any).__ecoPasteImageTimeout = setTimeout(() => {
      (window as any).__isEcoPasteImageEcho = false;
    }, 3000); // 3秒，覆盖插件的延迟异步处理
  }
};

export const writeToClipboard = (
  data: DatabaseSchemaHistory,
  action: "copy" | "paste" = "copy",
) => {
  markInternalClipboardWrite(data.type === "image", action);
  const { type, value, search } = data;

  switch (type) {
    case "text":
      return writeText(value);
    case "rtf":
      return writeRTF(search, value);
    case "html":
      return writeHTML(search, value);
    case "image":
      return writeImage(value);
    case "files":
      return writeFiles(value);
  }
};

export const pasteToClipboard = async (
  data: DatabaseSchemaHistory,
  asPlain?: boolean,
  options?: { pinned?: boolean },
) => {
  const { type, value, search } = data;
  const { pastePlain } = clipboardStore.content;

  if (asPlain ?? pastePlain) {
    markInternalClipboardWrite(type === "image", "paste");
    if (type === "files") {
      await writeText(value.join("\n"));
    } else {
      await writeText(search);
    }
  } else {
    await writeToClipboard(data, "paste");
  }

  // 图片粘贴时，回声路径因文件名不同无法走 matched 置顶，在此处主动置顶
  if (clipboardStore.content.autoSort && data.id && type === "image") {
    await updateHistory(data.id, { createTime: formatDate() });
    emit(LISTEN_KEY.REFRESH_CLIPBOARD_LIST);
  }

  // 窗口置顶（钉住）时不关闭窗口
  if (!options?.pinned) {
    hideWindow();
  }

  playPasteSound();

  return paste();
};
