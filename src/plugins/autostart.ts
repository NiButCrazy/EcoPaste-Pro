import { invoke } from "@tauri-apps/api/core";

const COMMAND = {
  IS_AUTOSTART: "plugin:eco-autostart|is_autostart",
  IS_ELEVATED: "plugin:eco-autostart|is_elevated",
  RESTART_AS_ADMIN: "plugin:eco-autostart|restart_as_admin",
};

/**
 * 是否为开机自动启动
 */
export const isAutostart = () => {
  return invoke<boolean>(COMMAND.IS_AUTOSTART);
};

/**
 * 是否已以管理员身份运行
 */
export const isElevated = () => {
  return invoke<boolean>(COMMAND.IS_ELEVATED);
};

/**
 * 以管理员身份重新启动应用
 */
export const restartAsAdmin = () => {
  return invoke<void>(COMMAND.RESTART_AS_ADMIN);
};
