/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RENDERER_VITE_VIDEO_INPUT: string
  readonly RENDERER_VITE_AUDIO_INPUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
