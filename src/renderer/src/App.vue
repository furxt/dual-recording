<template>
  <Suspense>
    <div class="bg-gray-100 h-[100vh] app">
      <TitleBar />
      <Record />
      <div
        v-if="isDownloadUpdateApp"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <el-progress type="dashboard" :percentage="percentage" :color="colors" />
      </div>

      <!-- <div class="flex">
        <div class="w-[600px]">其他区域</div>
        <Record />
      </div> -->
    </div>
  </Suspense>
</template>

<script setup>
import { useGlobalConfigStore } from '@renderer/stores'
import { IS_DEV } from '@renderer/utils/common'

window.electron.ipcRenderer.on('update-conf', (_event, data) => {
  console.log('收到主进程的消息:', data)
  globalConfigStore.config = { ...globalConfigStore.config, ...data }
})

let loading
const isDownloadUpdateApp = ref(false)
const percentage = ref(0)
const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

// 新版本可用
window.electron.ipcRenderer.on('update-available', (_event, version) => {
  ElMessageBox.confirm(`检测到有新版本 ${version} 可用，是否下载更新？`, '更新提示', {
    closeOnClickModal: false,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'primary'
  })
    .then(() => {
      window.electron.ipcRenderer.send('download-update')
      loading = ElLoading.service({
        lock: true,
        background: 'rgba(250, 250, 250, 0.7)', // 白色半透明背景
        customClass: 'transparent-loading' // 自定义类名
      })
      isDownloadUpdateApp.value = true
    })
    .catch(() => {})
})

// 新版本下载进度
window.electron.ipcRenderer.on('download-progress', (_event, downloadPercent) => {
  percentage.value = downloadPercent
})

// 新版本下载完成
window.electron.ipcRenderer.on('update-downloaded', () => {
  setTimeout(() => {
    if (loading) {
      loading.close()
      loading = null
    }
    isDownloadUpdateApp.value = false
    ElMessageBox.confirm(`下载已完成，是否立即更新？`, '更新提示', {
      closeOnClickModal: false,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    })
      .then(() => {
        window.electron.ipcRenderer.send('install-update')
      })
      .catch(() => {})
  }, 500)
})

if (IS_DEV)
  window.electron.ipcRenderer.on('catch-error', (_event, data) => {
    console.log('收到主进程的错误消息:', data)
    ElMessage.error(data)
  })

const globalConfigStore = useGlobalConfigStore()

onMounted(async () => {
  // 检查更新
  await window.electron.ipcRenderer.invoke('check-update')
})
</script>

<style lang="scss" scoped>
.app {
  background: linear - gradient(to top right, #f78ba3, #4a2e60);
}
</style>
