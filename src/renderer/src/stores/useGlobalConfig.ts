export const useGlobalConfigStore = defineStore(
  'useGlobalConfigStore',
  () => {
    const isRecording = ref(false)
    const config = ref<Config>({
      audioinputDeviceId: null,
      videoinputDeviceId: null
    })
    return {
      config,
      isRecording
    }
  },
  {
    persist: {
      pick: ['config']
    }
  }
)

// 定义类型
interface Config {
  audioinputDeviceId?: string | null
  videoinputDeviceId?: string | null
}
