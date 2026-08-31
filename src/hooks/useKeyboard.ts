import { useFocusWithin, useKeyPress } from "ahooks";
import type { KeyType } from "ahooks/lib/useKeyPress";
import { useContext } from "react";
import { LISTEN_KEY, PRESET_SHORTCUT } from "@/constants";
import { MainContext } from "@/pages/Main";

const keys = [
  "space",
  "enter",
  "backspace",
  "delete",
  "uparrow",
  "downarrow",
  "home",
  PRESET_SHORTCUT.FAVORITE,
  PRESET_SHORTCUT.OPEN_IN_EXPLORER,
  PRESET_SHORTCUT.COPY,
];

interface UseKeyboardProps {
  scrollToTop: () => void;
}

export const useKeyboard = (props: UseKeyboardProps) => {
  const { scrollToTop } = props;
  const { rootState } = useContext(MainContext);
  const isFocusWithin = useFocusWithin(document.body);

  const handleKeyPress = (event: KeyboardEvent, key: KeyType) => {
    event.preventDefault();

    if (key === "home") {
      return scrollToTop();
    }

    const { activeId, eventBus } = rootState;

    if (!activeId) return;

    switch (key) {
      // 空格预览
      case "space":
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_PREVIEW,
          id: activeId,
        });
      // 回车粘贴
      case "enter":
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_PASTE,
          id: activeId,
        });
      // 删除
      case "backspace":
      case "delete":
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_DELETE,
          id: activeId,
        });
      // 选中上一个
      case "uparrow":
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_SELECT_PREV,
          id: activeId,
        });
      // 选中下一个
      case "downarrow":
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_SELECT_NEXT,
          id: activeId,
        });
      // 收藏和取消收藏
      case PRESET_SHORTCUT.FAVORITE:
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_FAVORITE,
          id: activeId,
        });
      // 资源管理器中打开
      case PRESET_SHORTCUT.OPEN_IN_EXPLORER:
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_OPEN_IN_EXPLORER,
          id: activeId,
        });
      // 复制条目
      case PRESET_SHORTCUT.COPY:
        return eventBus?.emit({
          action: LISTEN_KEY.CLIPBOARD_ITEM_COPY,
          id: activeId,
        });
    }
  };

  useKeyPress(keys, handleKeyPress, {
    events: isFocusWithin ? [] : ["keydown"],
  });
};
