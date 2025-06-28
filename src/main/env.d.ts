interface ImportMetaEnv extends ViteEnv {}

interface ViteEnv {
  readonly MAIN_VITE_APP_UPDATE_SERVER: string
  readonly MAIN_VITE_WIN_APP_UPDATE_URL: string
  readonly MAIN_VITE_LINUX_APP_UPDATE_URL: string
  readonly MAIN_VITE_MAC_APP_UPDATE_URL: string

  readonly MAIN_VITE_SEVER_URL: string
  readonly MAIN_VITE_API_PREFIX: string
  readonly MAIN_VITE_SAVE_CHUNK_URL: string
  readonly MAIN_VITE_MERGE_CHUNK_URL: string
  readonly MAIN_VITE_CHECK_FILE_URL: string
}
