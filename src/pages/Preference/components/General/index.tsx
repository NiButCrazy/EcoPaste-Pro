import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProSwitch from "@/components/ProSwitch";
import { useImmediateKey } from "@/hooks/useImmediateKey";
import { restartAsAdmin } from "@/plugins/autostart";
import { globalStore } from "@/stores/global";
import { isMac, isWin } from "@/utils/is";
import { saveStore } from "@/utils/store";
import Language from "./components/Language";
import MacosPermissions from "./components/MacosPermissions";
import ThemeMode from "./components/ThemeMode";
import ViewMode from "./components/ViewMode";

const General = () => {
  const { app, update, quicklook } = useSnapshot(globalStore);
  const { t } = useTranslation();

  // 监听自动启动变更
  useImmediateKey(globalStore.app, "autoStart", async (value) => {
    const enabled = await isEnabled();

    if (value && !enabled) {
      return enable();
    }

    if (!value && enabled) {
      disable();
    }
  });

  // 开启管理员启动：落盘配置后以管理员身份重新启动
  const handleRunAsAdminChange = async (value: boolean) => {
    globalStore.app.runAsAdmin = value;

    if (!value) {
      return;
    }

    try {
      await saveStore();
      await restartAsAdmin();
    } catch {
      globalStore.app.runAsAdmin = false;

      await saveStore();

      message.error(
        t("preference.settings.app_settings.hints.run_as_admin_failed"),
      );
    }
  };

  return (
    <>
      {isMac && <MacosPermissions />}

      <ProList header={t("preference.settings.app_settings.title")}>
        <ProSwitch
          onChange={(value) => {
            globalStore.app.autoStart = value;
          }}
          title={t("preference.settings.app_settings.label.auto_start")}
          value={app.autoStart}
        />

        {isWin && (
          <ProSwitch
            description={t(
              "preference.settings.app_settings.hints.run_as_admin",
            )}
            onChange={handleRunAsAdminChange}
            title={t("preference.settings.app_settings.label.run_as_admin")}
            value={app.runAsAdmin}
          />
        )}

        <ProSwitch
          description={t("preference.settings.app_settings.hints.silent_start")}
          onChange={(value) => {
            globalStore.app.silentStart = value;
          }}
          title={t("preference.settings.app_settings.label.silent_start")}
          value={app.silentStart}
        />

        <ProSwitch
          onChange={(value) => {
            globalStore.app.showMenubarIcon = value;
          }}
          title={t("preference.settings.app_settings.label.show_menubar_icon")}
          value={app.showMenubarIcon}
        />

        <ProSwitch
          onChange={(value) => {
            globalStore.app.showTaskbarIcon = value;
          }}
          title={t("preference.settings.app_settings.label.show_taskbar_icon")}
          value={app.showTaskbarIcon}
        />
      </ProList>

      <ProList header={t("preference.settings.appearance_settings.title")}>
        <Language />

        <ThemeMode />

        <ViewMode />
      </ProList>

      <ProList header={t("preference.settings.update_settings.title")}>
        <ProSwitch
          onChange={(value) => {
            globalStore.update.auto = value;
          }}
          title={t("preference.settings.update_settings.label.auto_update")}
          value={update.auto}
        />

        <ProSwitch
          description={t(
            "preference.settings.update_settings.hints.update_beta",
          )}
          onChange={(value) => {
            globalStore.update.beta = value;
          }}
          title={t("preference.settings.update_settings.label.update_beta")}
          value={update.beta}
        />
      </ProList>
      <ProList header={t("preference.settings.quicklook.title")}>
        <ProSwitch
          description={t("preference.settings.quicklook.label.description")}
          onChange={(value) => {
            globalStore.quicklook.enable = value;
          }}
          title={t("preference.settings.quicklook.label.title")}
          value={quicklook.enable}
        />
      </ProList>
    </>
  );
};

export default General;
