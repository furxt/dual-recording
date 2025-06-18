export const useGlobalConfigStore = defineStore(
  'useGlobalConfigStore',
  () => {
    const config = ref<Config>({
      audioinputDeviceId: null,
      videoinputDeviceId: null
    })
    return {
      config
    }
  },
  {
    persist: true
  }
)

// 定义类型
interface Config {
  audioinputDeviceId: string | null
  videoinputDeviceId: string | null
}
