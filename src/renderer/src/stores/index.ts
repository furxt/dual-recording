import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const store = createPinia()
store.use(piniaPluginPersistedstate)

export { store }

export * from './useGlobalConfig'

export default store
