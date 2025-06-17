import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalConfigStore = defineStore(
  'useGlobalConfigStore',
  () => {
    const config = ref({
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
