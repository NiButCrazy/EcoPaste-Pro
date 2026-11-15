import attentionAudio from "@/assets/audio/attention.wav";
import closeAudio from "@/assets/audio/close.wav";
import copyAudio from "@/assets/audio/copy.mp3";
import copyOldAudio from "@/assets/audio/copy.old.mp3";
import errorAudio from "@/assets/audio/error.wav";
import openAudio from "@/assets/audio/open.wav";
import readyAudio from "@/assets/audio/ready.wav";
import selectAudio from "@/assets/audio/select.wav";
import successAudio from "@/assets/audio/success.wav";
import tapAudio from "@/assets/audio/tap.wav";
import toggleAudio from "@/assets/audio/toggle.wav";
import warningAudio from "@/assets/audio/warning.wav";

export type AudioSourceKey =
  | "attention"
  | "close"
  | "copy"
  | "copy-old"
  | "error"
  | "open"
  | "ready"
  | "select"
  | "success"
  | "tap"
  | "toggle"
  | "warning";

export const BUILTIN_AUDIO_SOURCES: Record<AudioSourceKey, string> = {
  attention: attentionAudio,
  close: closeAudio,
  copy: copyAudio,
  "copy-old": copyOldAudio,
  error: errorAudio,
  open: openAudio,
  ready: readyAudio,
  select: selectAudio,
  success: successAudio,
  tap: tapAudio,
  toggle: toggleAudio,
  warning: warningAudio,
};

export const resolveAudioSource = (
  source: string | undefined,
  fallback: AudioSourceKey,
) => {
  return (
    BUILTIN_AUDIO_SOURCES[source as AudioSourceKey] ??
    BUILTIN_AUDIO_SOURCES[fallback]
  );
};
