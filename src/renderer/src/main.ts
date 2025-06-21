import ElementPlus from 'element-plus'
import store from './stores'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(store)
app.use(ElementPlus)
app.mount('#app')
