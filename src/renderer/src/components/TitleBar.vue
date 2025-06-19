<template>
  <div class="custom-title-bar">
    <div class="title pl-3">
      <span class="text-gray-700">{{ version }}</span>
    </div>
    <!-- 右侧操作按钮 -->
    <div class="title-bar-controls">
      <button class="control-btn minimize-btn" @click="minimizeWindow" title="最小化">
        <Minus theme="outline" size="14" fill="#ffffff" />
      </button>

      <button class="control-btn close-btn" @click="closeWindow" title="关闭">
        <Close theme="outline" size="14" fill="#ffffff" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close, Minus } from '@icon-park/vue-next'
const minimizeWindow = () => {
  window.electron.ipcRenderer.send('window-minimize')
}

const closeWindow = () => {
  ElMessageBox.confirm('确认退出吗?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    window.electron.ipcRenderer.send('window-close')
  })
}

const version = ref('')
onMounted(async () => {
  version.value = await window.electron.ipcRenderer.invoke('app-version')
})
</script>

<style scoped>
.custom-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* color: white; */
  padding: 0;
  height: 30px;
  -webkit-app-region: drag; /* 允许拖拽 */
  font-family: sans-serif;
  user-select: none;
}

.title {
  font-size: 14px;
  font-weight: bold;
  -webkit-app-region: drag;
}

.title-bar-controls {
  display: flex;
  gap: 3px;
  -webkit-app-region: no-drag; /* 防止按钮区域被拖动 */
}

.control-btn {
  width: 28px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.3s,
    opacity 0.3s;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.minimize-btn:hover svg {
  fill: #fdd835;
}

.maximize-btn:hover svg {
  fill: #4caf50;
}

.close-btn:hover {
  background-color: #e53935;
}
.close-btn:hover svg {
  fill: white;
}

svg {
  fill: currentColor;
}
</style>
