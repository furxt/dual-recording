interface ViteEnv {
  readonly RENDERER_VITE_VIDEO_INPUT: string
  readonly RENDERER_VITE_AUDIO_INPUT: string
}

type TimerId = ReturnType<typeof setTimeout>
