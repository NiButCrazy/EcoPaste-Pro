import { useCreation } from "ahooks";
import { Switch } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import Audio, { type AudioRef } from "@/components/Audio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import UnoIcon from "@/components/UnoIcon";
import { clipboardStore } from "@/stores/clipboard";
import { type AudioSourceKey, resolveAudioSource } from "@/utils/audio";

const AUDIO_OPTIONS: { labelKey: string; value: AudioSourceKey }[] = [
  {
    labelKey: "preference.clipboard.audio_settings.label.copy_audio",
    value: "copy",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.copy_old_audio",
    value: "copy-old",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.attention_audio",
    value: "attention",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.close_audio",
    value: "close",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.error_audio",
    value: "error",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.open_audio",
    value: "open",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.ready_audio",
    value: "ready",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.select_audio",
    value: "select",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.success_audio",
    value: "success",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.tap_audio",
    value: "tap",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.toggle_audio",
    value: "toggle",
  },
  {
    labelKey: "preference.clipboard.audio_settings.label.warning_audio",
    value: "warning",
  },
];

const AudioSettings = () => {
  const { audio } = useSnapshot(clipboardStore);
  const { t } = useTranslation();
  const audioRef = useRef<AudioRef>(null);
  const pasteAudioRef = useRef<AudioRef>(null);

  const audioOptions = useCreation(
    () =>
      AUDIO_OPTIONS.map(({ labelKey, value }) => ({
        label: t(labelKey),
        value,
      })),
    [t],
  );

  return (
    <>
      <Audio
        ref={audioRef}
        src={resolveAudioSource(audio.copySource, "toggle")}
      />
      <Audio
        ref={pasteAudioRef}
        src={resolveAudioSource(audio.pasteSource, "select")}
      />

      <ProList header={t("preference.clipboard.audio_settings.title")}>
        <ProListItem
          title={t("preference.clipboard.audio_settings.label.copy_audio")}
        >
          <AdaptiveSelect
            onChange={(value) => {
              clipboardStore.audio.copySource = value;
            }}
            options={audioOptions}
            value={audio.copySource ?? "toggle"}
          />

          <UnoIcon
            className="flex!"
            hoverable
            name="i-iconamoon:volume-up-light"
            onClick={() => {
              audioRef.current?.play();
            }}
            size={22}
          />

          <Switch
            checked={audio.copy}
            onChange={(value) => {
              clipboardStore.audio.copy = value;
            }}
          />
        </ProListItem>

        <ProListItem
          title={t("preference.clipboard.audio_settings.label.paste_audio")}
        >
          <AdaptiveSelect
            onChange={(value) => {
              clipboardStore.audio.pasteSource = value;
            }}
            options={audioOptions}
            value={audio.pasteSource ?? "select"}
          />

          <UnoIcon
            className="flex!"
            hoverable
            name="i-iconamoon:volume-up-light"
            onClick={() => {
              pasteAudioRef.current?.play();
            }}
            size={22}
          />

          <Switch
            checked={audio.paste}
            onChange={(value) => {
              clipboardStore.audio.paste = value;
            }}
          />
        </ProListItem>
      </ProList>
    </>
  );
};

export default AudioSettings;
