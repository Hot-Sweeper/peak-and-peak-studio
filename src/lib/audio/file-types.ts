/**
 * iOS Safari/WebKit ignores accept="audio/*" and grays out audio files (WebKit #242110).
 * List explicit MIME types and extensions instead.
 */
export const AUDIO_FILE_ACCEPT =
  "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave,audio/x-m4a,audio/mp4,audio/aac,audio/flac,audio/ogg,audio/webm,.mp3,.wav,.m4a,.aac,.flac,.ogg,.webm,.opus";

const AUDIO_EXT = /\.(mp3|wav|ogg|flac|aac|webm|m4a|opus|mp4)$/i;

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXT.test(file.name);
}
