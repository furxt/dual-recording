<template>
  <Suspense>
    <div class="bg-gray-100 h-[100vh] app">
      <TitleBar v-model:showCloseWindowMsgBox="showCloseWindowMsgBox" />
      <Record />
      <div
        v-if="isDownloadUpdateApp"
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <el-progress type="dashboard" :percentage="percentage" :color="progressConstant.colors" />
      </div>

      <!-- <div class="flex">
        <div class="w-[600px]">其他区域</div>
        <Record />
      </div> -->
    </div>
  </Suspense>
</template>

<script setup lang="ts">
import { progressConstant } from './constants'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'
import { useGlobalConfigStore } from './stores'
import utils from './utils'
import {
  DOWNLOAD_UPDATE,
  INSTALL_UPDATE,
  WINDOW_CLOSE,
  CHECK_UPDATE,
  PRIMARY_MESSAGE,
  APP_PAGE,
  APP_ICON_PATH,
  UPDATE_AVAILABLE,
  DOWNLOAD_PROGRESS,
  CLOSE_WINDOW,
  UPDATE_DOWNLOADED,
  CATCH_ERROR
} from '@constants/index'

const showCloseWindowMsgBox = ref(false)

const globalConfigStore = useGlobalConfigStore()

window.electron.ipcRenderer.on(APP_PAGE, (_event, code, data) => {
  if (code === PRIMARY_MESSAGE) {
    console.log('常规提示消息', data)
    ElMessage.primary(data)
  } else if (code === UPDATE_AVAILABLE) {
    console.log('检测到有新版本可以更新')
    ElMessageBox.confirm(`检测到有新版本 ${data} 可用，是否下载更新？`, '更新提示', {
      closeOnClickModal: false,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'primary'
    })
      .then(() => {
        utils.ipcRenderer.send(DOWNLOAD_UPDATE)
        loading = ElLoading.service({
          lock: true,
          background: 'rgba(250, 250, 250, 0.7)', // 白色半透明背景
          customClass: 'transparent-loading' // 自定义类名
        })
        isDownloadUpdateApp.value = true
      })
      .catch(() => {})
  } else if (code === DOWNLOAD_PROGRESS) {
    console.log('下载更新进度条')
    percentage.value = data
  } else if (code === CLOSE_WINDOW) {
    console.log('关闭窗口')

    if (!showCloseWindowMsgBox.value) {
      showCloseWindowMsgBox.value = true
      ElMessageBox.confirm('确认退出吗?', '警告', {
        closeOnClickModal: false,
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          utils.ipcRenderer.send(WINDOW_CLOSE)
          showCloseWindowMsgBox.value = false
        })
        .catch(() => {
          showCloseWindowMsgBox.value = false
        })
    }
  } else if (code === UPDATE_DOWNLOADED) {
    console.log('更新下载完成')
    setTimeout(() => {
      if (loading) {
        loading?.close()
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
          utils.ipcRenderer.send(INSTALL_UPDATE)
        })
        .catch(() => {})
    }, 500)
  } else if (code === CATCH_ERROR) {
    console.log('收到node捕获的错误消息')
    ElMessage.error(data)
  }
})

let loading: LoadingInstance | null
const isDownloadUpdateApp = ref(false)
const percentage = ref(0)

// 新版本可用
// window.electron.ipcRenderer.on('update-available', (_event, version) => {
//   ElMessageBox.confirm(`检测到有新版本 ${version} 可用，是否下载更新？`, '更新提示', {
//     closeOnClickModal: false,
//     confirmButtonText: '确认',
//     cancelButtonText: '取消',
//     type: 'primary'
//   })
//     .then(() => {
//       utils.ipcRenderer.send(DOWNLOAD_UPDATE)
//       loading = ElLoading.service({
//         lock: true,
//         background: 'rgba(250, 250, 250, 0.7)', // 白色半透明背景
//         customClass: 'transparent-loading' // 自定义类名
//       })
//       isDownloadUpdateApp.value = true
//     })
//     .catch(() => {})
// })

// 新版本下载进度
// window.electron.ipcRenderer.on('download-progress', (_event, downloadPercent) => {
//   percentage.value = downloadPercent
// })

// 新版本下载完成
// window.electron.ipcRenderer.on('update-downloaded', () => {
//   setTimeout(() => {
//     if (loading) {
//       loading?.close()
//       loading = null
//     }
//     isDownloadUpdateApp.value = false
//     ElMessageBox.confirm(`下载已完成，是否立即更新？`, '更新提示', {
//       closeOnClickModal: false,
//       confirmButtonText: '确认',
//       cancelButtonText: '取消',
//       type: 'success'
//     })
//       .then(() => {
//         utils.ipcRenderer.send(INSTALL_UPDATE)
//       })
//       .catch(() => {})
//   }, 500)
// })

// window.electron.ipcRenderer.on('catch-error', (_event, data) => {
//   console.log('收到主进程的错误消息:', data)
//   ElMessage.error(data)
// })

onMounted(async () => {
  const appIconPath = await utils.ipcRenderer.invoke(APP_ICON_PATH)
  globalConfigStore.config.appIconPath = appIconPath
  // 检查更新
  await utils.ipcRenderer.invoke(CHECK_UPDATE)
})
</script>

<style lang="scss" scoped>
.app {
  background: linear - gradient(to top right, #f78ba3, #4a2e60);
}
</style>
