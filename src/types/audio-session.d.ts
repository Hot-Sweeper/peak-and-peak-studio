type AudioSessionType =
  | "auto"
  | "playback"
  | "transient"
  | "transient-solo"
  | "ambient"
  | "play-and-record";

interface AudioSession {
  type: AudioSessionType;
}

interface Navigator {
  readonly audioSession: AudioSession;
}
